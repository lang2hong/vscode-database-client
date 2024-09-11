"use strict";

import * as vscode from "vscode";
import { Console } from "./common/Console";
import { CodeCommand, DatabaseType, ModelType, Template } from "./common/constants";
import { ConnectionNode } from "./model/database/connectionNode";
import { SchemaNode } from "./model/database/schemaNode";
import { UserGroup } from "./model/database/userGroup";
import { CopyAble } from "./model/interface/copyAble";
import { FunctionNode } from "./model/main/function";
import { FunctionGroup } from "./model/main/functionGroup";
import { ProcedureNode } from "./model/main/procedure";
import { ProcedureGroup } from "./model/main/procedureGroup";
import { TableGroup } from "./model/main/tableGroup";
import { TableNode } from "./model/main/tableNode";
import { TriggerNode } from "./model/main/trigger";
import { TriggerGroup } from "./model/main/triggerGroup";
import { ViewGroup } from "./model/main/viewGroup";
import { ViewNode } from "./model/main/viewNode";
import { ColumnNode } from "./model/other/columnNode";
// Don't change last order, it will occur circular reference
import { init } from "vscode-nls-i18n";
import { FileModel } from "./common/filesManager";
import { UserNode } from "./model/database/userNode";
import { EsConnectionNode } from "./model/es/model/esConnectionNode";
import { ESIndexNode } from "./model/es/model/esIndexNode";
import { activeEs } from "./model/es/provider/main";
import { FTPFileNode } from "./model/ftp/ftpFileNode";
import { Node } from "./model/interface/node";
import { QueryGroup } from "./model/query/queryGroup";
import { QueryNode } from "./model/query/queryNode";
import KeyNode from "./model/redis/keyNode";
import { RedisConnectionNode } from "./model/redis/redisConnectionNode";
import { RemainNode } from "./model/redis/remainNode";
import { FileNode } from "./model/ssh/fileNode";
import { SSHConnectionNode } from "./model/ssh/sshConnectionNode";
import { HistoryNode } from "./provider/history/historyNode";
import { DbTreeDataProvider } from "./provider/treeDataProvider";
import { DatabaseCache } from "./service/common/databaseCache";
import { ConnectService } from "./service/connect/connectService";
import { ConnectionManager } from "./service/connectionManager";
import { DiffService } from "./service/diff/diffService";
import { QueryUnit } from "./service/queryUnit";
import { ServiceManager } from "./service/serviceManager";

export function activate(context: vscode.ExtensionContext) {

    init(context.extensionPath);
    const serviceManager = new ServiceManager(context)

    activeEs(context)

    ConnectionNode.init()
    context.subscriptions.push(
        ...serviceManager.init(),
        vscode.window.onDidChangeActiveTextEditor(detectActive),
        ConnectService.listenConfig(),
        ...initCommand({
            // util
            ...{
                [CodeCommand.Refresh]: async (node: Node, byConnection: boolean) => {
                    if (node) {
                        if (byConnection) {
                            DatabaseCache.clearByConnection(node.key)
                        } else {
                            await node.getChildren(true)
                        }
                    } else {
                        DatabaseCache.clearCache()
                    }
                    DbTreeDataProvider.refresh(node)
                },
                [CodeCommand.RecordHistory]: (sql: string, costTime: number) => {
                    serviceManager.historyService.recordHistory(sql, costTime);
                },
                "mysql.history.open": () => serviceManager.historyService.showHistory(),
                "mysql.setting.open": () => {
                    serviceManager.settingService.open();
                },
                "mysql.server.info": (connectionNode: ConnectionNode) => {
                    serviceManager.statusService.show(connectionNode)
                },
                "mysql.name.copy": (copyAble: CopyAble) => {
                    copyAble.copyName();
                },
            },
            // connection
            ...{
                "mysql.connection.add": () => {
                    serviceManager.connectService.openConnect(serviceManager.provider)
                },
                "mysql.connection.edit": (connectionNode: ConnectionNode) => {
                    serviceManager.connectService.openConnect(connectionNode.provider, connectionNode)
                },
                "mysql.connection.config": () => {
                    serviceManager.connectService.openConfig()
                },
                "mysql.connection.open": (connectionNode: ConnectionNode) => {
                    connectionNode.provider.openConnection(connectionNode)
                },
                "mysql.connection.disable": (connectionNode: ConnectionNode) => {
                    connectionNode.provider.disableConnection(connectionNode)
                },
                "mysql.connection.delete": (connectionNode: ConnectionNode) => {
                    connectionNode.deleteConnection(context);
                },
                "mysql.host.copy": (connectionNode: ConnectionNode) => {
                    connectionNode.copyName();
                },
            },
            // externel data
            ...{
                "mysql.util.github": () => {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/lang2hong/vscode-database-client'));
                },
                "mysql.struct.diff": () => {
                    new DiffService().startDiff(serviceManager.provider);
                },
                "mysql.data.export": (node: SchemaNode | TableNode) => {
                    ServiceManager.getDumpService(node.dbType).dump(node, true)
                },
                "mysql.struct.export": (node: SchemaNode | TableNode) => {
                    ServiceManager.getDumpService(node.dbType).dump(node, false)
                },
                "mysql.document.generate": (node: SchemaNode | TableNode) => {
                    ServiceManager.getDumpService(node.dbType).generateDocument(node)
                },
                "mysql.data.import": (node: SchemaNode | ConnectionNode) => {
                    const importService = ServiceManager.getImportService(node.dbType);
                    vscode.window.showOpenDialog({ filters: importService.filter(), canSelectMany: true, openLabel: "Select sql file to import", canSelectFiles: true, canSelectFolders: false }).then((uriList) => {
                        if (uriList)
                            importService.batchImportSql(uriList.map(uri => uri.fsPath), node)
                    });
                },
            },
            // ssh
            ...{
                'mysql.ssh.folder.new': (parentNode: SSHConnectionNode) => parentNode.newFolder(),
                'mysql.ssh.file.new': (parentNode: SSHConnectionNode) => parentNode.newFile(),
                'mysql.ssh.host.copy': (parentNode: SSHConnectionNode) => parentNode.copyIP(),
                'mysql.ssh.forward.port': (parentNode: SSHConnectionNode) => parentNode.fowardPort(),
                'mysql.ssh.file.upload': (parentNode: SSHConnectionNode) => parentNode.upload(),
                'mysql.ssh.folder.open': (parentNode: SSHConnectionNode) => parentNode.openInTeriminal(),
                'mysql.ssh.path.copy': (node: Node) => node.copyName(),
                'mysql.ssh.socks.port': (parentNode: SSHConnectionNode) => parentNode.startSocksProxy(),
                'mysql.ssh.file.delete': (fileNode: FileNode | SSHConnectionNode) => fileNode.delete(),
                'mysql.ssh.file.open': (fileNode: FileNode | FTPFileNode) => fileNode.open(),
                'mysql.ssh.file.download': (fileNode: FileNode) => fileNode.download(),
            },
            // database
            ...{
                "mysql.db.active": () => {
                    serviceManager.provider.activeDb();
                },
                "mysql.db.truncate": (databaseNode: SchemaNode) => {
                    databaseNode.truncateDb();
                },
                "mysql.database.add": (connectionNode: ConnectionNode) => {
                    connectionNode.createDatabase();
                },
                "mysql.db.drop": (databaseNode: SchemaNode) => {
                    databaseNode.dropDatatabase();
                }
            },
            // mock
            ...{
                "mysql.mock.table": (tableNode: TableNode) => {
                    serviceManager.mockRunner.create(tableNode)
                },
                "mysql.mock.run": () => {
                    serviceManager.mockRunner.runMock()
                },
            },
            // user node
            ...{
                "mysql.change.user": (userNode: UserNode) => {
                    userNode.changePasswordTemplate();
                },
                "mysql.user.grant": (userNode: UserNode) => {
                    userNode.grandTemplate();
                },
                "mysql.user.sql": (userNode: UserNode) => {
                    userNode.selectSqlTemplate();
                },
            },
            // history
            ...{
                "mysql.history.view": (historyNode: HistoryNode) => {
                    historyNode.view()
                }
            },
            // query node
            ...{
                "mysql.runSQL": (sql: string) => {
                    if (typeof sql != 'string') { sql = null; }
                    QueryUnit.runQuery(sql, ConnectionManager.tryGetConnection());
                },
                "mysql.runAllQuery": () => {
                    QueryUnit.runQuery(null, ConnectionManager.tryGetConnection(), { runAll: true });
                },
                "mysql.query.switch": async (node: SchemaNode | EsConnectionNode | ESIndexNode) => {
                    if (node) {
                        if (node.dbType == DatabaseType.MONGO_DB) {
                            if (node.contextValue == ModelType.MONGO_TABLE) {
                                QueryUnit.showSQLTextDocument(node, `db('${node.schema}').collection('${node.label}').find({}).limit(100).toArray();`, Template.table, FileModel.APPEND);
                            } else {
                                QueryUnit.showSQLTextDocument(node, `db('${node.label}').collection('').find({}).limit(100).toArray();`, Template.table, FileModel.APPEND);
                            }
                        } else {
                            await node.newQuery();
                        }
                    } else {
                        vscode.workspace.openTextDocument({ language: 'sql' }).then(async (doc) => {
                            vscode.window.showTextDocument(doc)
                        });
                    }
                },
                "mysql.query.run": (queryNode: QueryNode) => {
                    queryNode.run()
                },
                "mysql.query.open": (queryNode: QueryNode) => {
                    queryNode.open()
                },
                "mysql.query.add": (queryGroup: QueryGroup) => {
                    queryGroup.add();
                },
                "mysql.query.rename": (queryNode: QueryNode) => {
                    queryNode.rename()
                }
            },
            // redis
            ...{
                "mysql.redis.connection.status": (connectionNode: RedisConnectionNode) => connectionNode.showStatus(),
                "mysql.connection.terminal": (node: Node) => node.openTerminal(),
                "mysql.redis.key.detail": (keyNode: KeyNode) => keyNode.detail(),
                "mysql.redis.key.del": (keyNode: KeyNode, keyNodeList: KeyNode[]) => keyNode.delete(keyNodeList),
                "mysql.redis.loadMore": (renmainNode: RemainNode) => renmainNode.click(),
            },
            // table node
            ...{
                "mysql.show.esIndex": (indexNode: ESIndexNode) => {
                    indexNode.viewData()
                },
                "mysql.table.truncate": (tableNode: TableNode) => {
                    tableNode.truncateTable();
                },
                "mysql.table.drop": (tableNode: TableNode) => {
                    tableNode.dropTable();
                },
                "mysql.table.source": (tableNode: TableNode) => {
                    if (tableNode) { tableNode.showSource(); }
                },
                "mysql.view.source": (tableNode: TableNode) => {
                    if (tableNode) { tableNode.showSource(); }
                },
                "mysql.table.show": (tableNode: TableNode) => {
                    if (tableNode) { tableNode.openInNew(); }
                },
            },
            // column node
            ...{
                "mysql.column.up": (columnNode: ColumnNode) => {
                    columnNode.moveUp();
                },
                "mysql.column.down": (columnNode: ColumnNode) => {
                    columnNode.moveDown();
                },
                "mysql.column.add": (tableNode: (TableNode | ColumnNode)) => {
                    tableNode.addColumnTemplate();
                },
                "mysql.column.update": (columnNode: ColumnNode) => {
                    columnNode.updateColumnTemplate();
                },
                "mysql.column.drop": (columnNode: ColumnNode) => {
                    columnNode.dropColumnTemplate();
                },
                "mysql.column.createIndex": (columnNode: ColumnNode) => {
                    columnNode.createIndexTemplate();
                },
            },
            // template
            ...{
                "mysql.table.find": (tableNode: TableNode) => {
                    tableNode.openTable();
                },
                "mysql.codeLens.run": (sql: string) => {
                    QueryUnit.runQuery(sql, ConnectionManager.tryGetConnection(), { split: true, recordHistory: true })
                },
                "mysql.table.design": (tableNode: TableNode) => {
                    tableNode.designTable();
                },
            },
            // show source
            ...{
                "mysql.show.procedure": (procedureNode: ProcedureNode) => {
                    procedureNode.showSource();
                },
                "mysql.show.function": (functionNode: FunctionNode) => {
                    functionNode.showSource();
                },
                "mysql.show.trigger": (triggerNode: TriggerNode) => {
                    triggerNode.showSource();
                },
            },
            // create template
            ...{
                "mysql.template.sql": (tableNode: TableNode) => {
                    tableNode.selectSqlTemplate();
                },
                "mysql.template.table": (tableGroup: TableGroup) => {
                    tableGroup.createTemplate();
                },
                "mysql.template.procedure": (procedureGroup: ProcedureGroup) => {
                    procedureGroup.createTemplate();
                },
                "mysql.template.view": (viewGroup: ViewGroup) => {
                    viewGroup.createTemplate();
                },
                "mysql.template.trigger": (triggerGroup: TriggerGroup) => {
                    triggerGroup.createTemplate();
                },
                "mysql.template.function": (functionGroup: FunctionGroup) => {
                    functionGroup.createTemplate();
                },
                "mysql.template.user": (userGroup: UserGroup) => {
                    userGroup.createTemplate();
                },
            },
            // drop template
            ...{
                "mysql.delete.user": (userNode: UserNode) => {
                    userNode.drop();
                },
                "mysql.delete.view": (viewNode: ViewNode) => {
                    viewNode.drop();
                },
                "mysql.delete.procedure": (procedureNode: ProcedureNode) => {
                    procedureNode.drop();
                },
                "mysql.delete.function": (functionNode: FunctionNode) => {
                    functionNode.drop();
                },
                "mysql.delete.trigger": (triggerNode: TriggerNode) => {
                    triggerNode.drop();
                },
            },
        }),
    );

}

export function deactivate() {
}

function detectActive(): void {
    const fileNode = ConnectionManager.getByActiveFile();
    if (fileNode) {
        ConnectionManager.changeActive(fileNode);
    }
}

function initCommand(commandDefinition: any): vscode.Disposable[] {

    const dispose = []

    for (const command in commandDefinition) {
        dispose.push(vscode.commands.registerCommand(command, (...args: any[]) => {
            try {
                const result = commandDefinition[command](...args);
                if(result instanceof Promise){
                    result.catch(err=>{
                        Console.log(err)
                    })
                }
            } catch (error) {
                Console.log(error)
            }
        }))
    }
    return dispose;
}


// refrences
// - when : https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts