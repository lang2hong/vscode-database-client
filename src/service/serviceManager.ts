import { CacheKey, DatabaseType } from "@/common/constants";
import ConnectionProvider from "@/model/ssh/connectionProvider";
import { HighlightCreator } from "@/provider/codelen/highlightCreator";
import { SqlCodeLensProvider } from "@/provider/codelen/sqlCodeLensProvider";
import { SQLSymbolProvide } from "@/provider/sqlSymbolProvide";
import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import { FileManager } from "../common/filesManager";
import { Global } from "../common/global";
import { ViewManager } from "../common/viewManager";
import { CompletionProvider } from "../provider/complete/completionProvider";
import { SqlFormattingProvider } from "../provider/sqlFormattingProvider";
import { TableInfoHoverProvider } from "../provider/tableInfoHoverProvider";
import { DbTreeDataProvider } from "../provider/treeDataProvider";
import { DatabaseCache } from "./common/databaseCache";
import { HistoryRecorder } from "./common/historyRecorder";
import { ConnectService } from "./connect/connectService";
import { ClickHouseDialect } from "./dialect/clickHouseDialect";
import { EsDialect } from "./dialect/esDialect";
import { MongoDialect } from "./dialect/mongoDialect";
import { MssqlDIalect } from "./dialect/mssqlDIalect";
import { MysqlDialect } from "./dialect/mysqlDialect";
import { PostgreSqlDialect } from "./dialect/postgreSqlDialect";
import { SqlDialect } from "./dialect/sqlDialect";
import { SqliTeDialect } from "./dialect/sqliteDialect";
import { ClickHouseDumpService } from "./dump/clickHouseDumpService";
import { DumpService } from "./dump/dumpService";
import { MysqlDumpService } from "./dump/mysqlDumpService";
import { PostgreDumpService } from "./dump/postgreDumpService";
import { ClickHouseImortService } from "./import/clickHouseImortService";
import { MysqlImportService } from "./import/mysqlImportService";
import { PostgresqlImortService } from "./import/postgresqlImortService";
import { SqlServerImportService } from "./import/sqlServerImportService";
import { MockRunner } from "./mock/mockRunner";
import { ClickHousePageService } from "./page/clickHousePageService";
import { EsPageService } from "./page/esPageService";
import { MongoPageService } from "./page/mongoPageService";
import { MssqlPageService } from "./page/mssqlPageService";
import { MysqlPageSerivce } from "./page/mysqlPageSerivce";
import { PageService } from "./page/pageService";
import { PostgreSqlPageService } from "./page/postgreSqlPageService";
import { ResourceServer } from "./resourceServer";
import { MysqlSettingService } from "./setting/MysqlSettingService";
import { SettingService } from "./setting/settingService";
import { MysqlStatusService } from "./status/mysqlStatusService";
import { StatusService } from "./status/statusService";

export class ServiceManager {

    public static instance: ServiceManager;
    public connectService = new ConnectService();
    public historyService = new HistoryRecorder();
    public mockRunner: MockRunner;
    public provider: DbTreeDataProvider;
    public nosqlProvider: DbTreeDataProvider;
    public settingService: SettingService;
    public statusService: StatusService;
    public codeLenProvider: SqlCodeLensProvider;
    private isInit = false;

    constructor(private readonly context: ExtensionContext) {
        Global.context = context;
        this.mockRunner = new MockRunner();
        DatabaseCache.initCache();
        ViewManager.initExtesnsionPath(context.extensionPath);
        FileManager.init(context)
        ResourceServer.init(context.extensionPath)
        new ConnectionProvider();
    }

    public init(): vscode.Disposable[] {
        if (this.isInit) { return [] }
        const codeLenProvider = new SqlCodeLensProvider();
        this.codeLenProvider = codeLenProvider;
        new HighlightCreator()
        const res: vscode.Disposable[] = [
            vscode.languages.registerDocumentRangeFormattingEditProvider('sql', new SqlFormattingProvider()),
            vscode.languages.registerCodeLensProvider('sql', codeLenProvider),
            vscode.languages.registerDocumentSymbolProvider('sql', new SQLSymbolProvide()),
            vscode.languages.registerHoverProvider('sql', new TableInfoHoverProvider()),
            vscode.languages.registerCompletionItemProvider('sql', new CompletionProvider(), ' ', '.', ">", "<", "=", "(")
        ]

        this.initMysqlService();
        res.push(this.initTreeView())
        res.push(this.initTreeProvider())
        // res.push(vscode.window.createTreeView("github.lang2hong.history",{treeDataProvider:new HistoryProvider(this.context)}))
        ServiceManager.instance = this;
        this.isInit = true
        return res
    }


    private initTreeView() {
        this.provider = new DbTreeDataProvider(this.context, CacheKey.DATBASE_CONECTIONS);
        const treeview = vscode.window.createTreeView("github.lang2hong.mysql", {
            treeDataProvider: this.provider,
        });
        treeview.onDidCollapseElement((event) => {
            DatabaseCache.storeElementState(event.element, vscode.TreeItemCollapsibleState.Collapsed);
        });
        treeview.onDidExpandElement((event) => {
            DatabaseCache.storeElementState(event.element, vscode.TreeItemCollapsibleState.Expanded);
        });
        return treeview;
    }

    private initTreeProvider() {
        this.nosqlProvider = new DbTreeDataProvider(this.context, CacheKey.NOSQL_CONNECTION);
        const treeview = vscode.window.createTreeView("github.lang2hong.nosql", {
            treeDataProvider: this.nosqlProvider,
            canSelectMany: true,
        });
        treeview.onDidCollapseElement((event) => {
            DatabaseCache.storeElementState(event.element, vscode.TreeItemCollapsibleState.Collapsed);
        });
        treeview.onDidExpandElement((event) => {
            DatabaseCache.storeElementState(event.element, vscode.TreeItemCollapsibleState.Expanded);
        });
        return treeview;
    }


    private initMysqlService() {
        this.settingService = new MysqlSettingService();
        this.statusService = new MysqlStatusService()
    }

    public static getDumpService(dbType: DatabaseType): DumpService {
        if (!dbType) dbType = DatabaseType.MYSQL
        switch (dbType) {
            case DatabaseType.MYSQL:
                return new MysqlDumpService()
            case DatabaseType.PG:
                return new PostgreDumpService();
            case DatabaseType.CLICKHOUSE:
                return new ClickHouseDumpService();
        }
        return new DumpService()
    }

    public static getImportService(dbType: DatabaseType) {
        if (!dbType) dbType = DatabaseType.MYSQL
        switch (dbType) {
            case DatabaseType.MSSQL:
                return new SqlServerImportService()
            case DatabaseType.PG:
                return new PostgresqlImortService();
            case DatabaseType.CLICKHOUSE:
                return new ClickHouseImortService();
        }
        return new MysqlImportService()
    }

    public static getDialect(dbType: DatabaseType): SqlDialect {
        if (!dbType) dbType = DatabaseType.MYSQL
        switch (dbType) {
            case DatabaseType.MSSQL:
                return new MssqlDIalect()
            case DatabaseType.SQLITE:
                return new SqliTeDialect()
            case DatabaseType.PG:
                return new PostgreSqlDialect();
            case DatabaseType.CLICKHOUSE:
                return new ClickHouseDialect();
            case DatabaseType.ES:
                return new EsDialect();
            case DatabaseType.MONGO_DB:
                return new MongoDialect();
        }
        return new MysqlDialect()
    }

    public static getPageService(databaseType: DatabaseType): PageService {
        if (!databaseType) databaseType = DatabaseType.MYSQL
        switch (databaseType) {
            case DatabaseType.MSSQL:
                return new MssqlPageService();
            case DatabaseType.PG:
                return new PostgreSqlPageService();
            case DatabaseType.CLICKHOUSE:
                return new ClickHousePageService();
            case DatabaseType.MONGO_DB:
                return new MongoPageService();
            case DatabaseType.ES:
                return new EsPageService();
        }

        return new MysqlPageSerivce();
    }

}