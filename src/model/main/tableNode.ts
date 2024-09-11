import { FileModel } from "@/common/filesManager";
import { ColumnMeta, TableMeta } from "@/common/typeDef";
import { Hanlder, ViewManager } from "@/common/viewManager";
import * as vscode from "vscode";
import { ConfigKey, DatabaseType, ModelType, Template } from "../../common/constants";
import { Global } from "../../common/global";
import { Util } from "../../common/util";
import { DbTreeDataProvider } from "../../provider/treeDataProvider";
import { ConnectionManager } from "../../service/connectionManager";
import { QueryUnit } from "../../service/queryUnit";
import { CopyAble } from "../interface/copyAble";
import { Node } from "../interface/node";
import { ColumnNode } from "../other/columnNode";
import { InfoNode } from "../other/infoNode";

export class TableNode extends Node implements CopyAble {

    public iconPath = new vscode.ThemeIcon("split-horizontal")
    public contextValue: string = ModelType.TABLE;
    public table: string;
    public primaryKey: string;

    constructor(readonly meta: TableMeta, readonly parent: Node) {
        super(`${meta.name}`)
        this.table = meta.name
        this.description = `${meta.comment || ''} ${meta.table_rows || ''}`
        // if (Util.supportColorIcon) {
        //   this.iconPath=new vscode.ThemeIcon("split-horizontal",new vscode.ThemeColor("problemsWarningIcon.foreground"))
        // }
        this.init(parent)
        this.bindToolTipe(meta)
        this.cacheSelf()
        this.command = {
            command: "mysql.table.find",
            title: "Run Select Statement",
            arguments: [this, true],
        }
    }

    public async getChildren(isRresh: boolean = false): Promise<Node[]> {
        let columnNodes = this.getChildCache();
        if (columnNodes && !isRresh) {
            return columnNodes;
        }
        return this.execute<ColumnMeta[]>(this.dialect.showColumns(this.schema, this.table))
            .then((columns) => {
                columnNodes = [];
                let temp: { [key: string]: ColumnNode } = {};
                for (let index = 0; index < columns.length; index++) {
                    const column = columns[index];
                    if (temp[column.name]) {
                        temp[column.name].updateInfo(column)
                    } else {
                        const colNode = new ColumnNode(this.table, column, this, index);
                        columnNodes.push(colNode)
                        temp[column.name] = colNode
                    }
                }
                this.setChildCache(columnNodes)
                return columnNodes;
            })
            .catch((err) => {
                return [new InfoNode(err)];
            });
    }

    public addColumnTemplate() {
        QueryUnit.showSQLTextDocument(this, this.dialect.addColumn(this.wrap(this.table)), Template.alter);
    }


    public async showSource(open = true) {
        let sql: string;
        if (this.dbType == DatabaseType.CLICKHOUSE || this.dbType == DatabaseType.MYSQL || this.dbType == DatabaseType.SQLITE) {
            const sourceResule = await this.execute<any[]>(this.dialect.showTableSource(this.schema, this.table))
            sql = sourceResule[0]['Create Table'];
            if (this.dbType == DatabaseType.SQLITE) {
                sql = sql.replace(/\\n/g, '\n').replace(/\\r/g, '');
            }
        } else {
            const pkList = [];
            const colDefList = [];
            const childs = await this.getChildren();
            for (let i = 0; i < childs.length; i++) {
                const child: ColumnNode = childs[i] as ColumnNode;
                if (child.isPrimaryKey) pkList.push(child.column.name);
                colDefList.push(`    ${child.column.name} ${child.type}`);
            }
            sql = `CREATE TABLE ${this.table}(
${colDefList.join(",\n")}${pkList.length > 0 ? `,\n    PRIMARY KEY(${pkList.join(",")})` : ""}
)`
        }
        if (open) {
            QueryUnit.showSQLTextDocument(this, sql);
        }
        return sql;
    }

    public dropTable() {

        Util.confirm(`Are you want to drop table ${this.table} ? `, async () => {
            this.execute(`DROP TABLE ${this.wrap(this.table)}`).then(() => {
                this.parent.setChildCache(null)
                DbTreeDataProvider.refresh(this.parent);
                vscode.window.showInformationMessage(`Drop table ${this.table} success!`);
            });
        })

    }


    public truncateTable() {

        Util.confirm(`Are you want to clear table ${this.table} all data ?`, async () => {
            const truncateSql = this.dbType == DatabaseType.SQLITE ? `DELETE FROM ${this.wrap(this.table)}` : `truncate table ${this.wrap(this.table)}`;
            this.execute(truncateSql).then(() => {
                vscode.window.showInformationMessage(`Clear table ${this.table} all data success!`);
            });
        })

    }



    public designTable() {

        const executeAndRefresh = async (sql: string, handler: Hanlder) => {
            try {
                await this.execute(sql)
                handler.emit("success")
            } catch (error) {
                handler.emit("error", error.message)
            }
        }

        ViewManager.createWebviewPanel({
            path: "app", title: "Design Table",
            splitView: false, iconPath: Global.getExtPath("resources", "icon", "dropper.svg"),
            eventHandler: (handler => {
                handler.on("init", () => {
                    handler.emit('route', 'design')
                }).on("route-design", async () => {
                    const result = await this.execute(this.dialect.showIndex(this.schema, this.table))
                    let primaryKey: string;
                    const columnList = (await this.getChildren()).map((columnNode: ColumnNode) => {
                        if (columnNode.isPrimaryKey) {
                            primaryKey = columnNode.column.name;
                        }
                        return columnNode.column;
                    });
                    handler.emit('design-data', { indexs: result, table: this.table, comment: this.meta.comment, columnList, primaryKey, dbType: this.dbType })
                }).on("updateTable", async ({ newTableName, newComment }) => {
                    const sql = this.dialect.updateTable({ table: this.table, newTableName, comment: this.meta.comment, newComment });
                    await executeAndRefresh(sql, handler)
                    this.parent.setChildCache(null)
                    this.provider.reload(this.parent)
                }).on("updateColumn", async (updateColumnParam) => {
                    const sql = this.dialect.updateColumnSql(updateColumnParam);
                    await executeAndRefresh(sql, handler)
                    this.setChildCache(null)
                    this.provider.reload(this.parent)
                }).on("dropIndex", async indexName => {
                    const sql = this.dialect.dropIndex(this.table, indexName);
                    await executeAndRefresh(sql, handler)
                }).on("execute", async sql => {
                    await executeAndRefresh(sql, handler)
                    this.setChildCache(null)
                    this.parent.setChildCache(null)
                    this.provider.reload(this.parent)
                }).on("createIndex", async ({ column, type, indexType }) => {
                    const sql = this.dialect.createIndex({ column, type, indexType, table: this.wrap(this.table) });
                    await executeAndRefresh(sql, handler)
                })
            })
        })

    }

    public async openInNew() {
        this.openTable(new Date().getTime())
    }

    public async openTable(viewId?: any) {
        const pageSize = Global.getConfig<number>(ConfigKey.DEFAULT_LIMIT);
        let sql = this.dialect.buildPageSql(this.wrap(this.schema), this.wrap(this.table), pageSize);
        // if (sql.includes("*")) {
        //     const columns = await this.getColumns()
        //     sql = sql.replace('*', columns.join(","))
        // }
        if (viewId === undefined || viewId == ''){
            viewId = this.table;
        }
        QueryUnit.runQuery(sql, this, { viewId });
        ConnectionManager.changeActive(this)
    }

    public bindToolTipe(meta: TableMeta) {
        this.tooltip = this.label;
        if (meta.comment) {
            this.tooltip += "-> " + meta.comment;
        }
        if (meta.auto_increment) {
            this.tooltip += "\nAUTO_INCREMENT: " + meta.auto_increment;
        }
    }

    public insertSqlTemplate(show: boolean = true): Promise<string> {
        return new Promise((resolve) => {
            this
                .getChildren()
                .then((children: Node[]) => {
                    const childrenNames = children.map((child: any) => "\n    " + this.wrap(child.column.name));
                    const childrenValues = children.map((child: any) => "\n    $" + child.column.name);
                    let sql = `insert into \n  ${this.wrap(this.table)} `;
                    sql += `(${childrenNames.toString().replace(/,/g, ", ")}\n  )\n`;
                    sql += "values\n  ";
                    sql += `(${childrenValues.toString().replace(/,/g, ", ")}\n  );`;
                    if (show) {
                        QueryUnit.showSQLTextDocument(this, sql, Template.table);
                    }
                    resolve(sql)
                });
        })
    }

    public async selectSqlTemplate() {
        const columns = await this.getColumns()
        const sql = `SELECT ${columns.join(",")} FROM ${this.wrap(this.table)};`;
        QueryUnit.showSQLTextDocument(this, sql, `${this.schema}.sql`, FileModel.APPEND)
    }

    private async getColumns() {
        return (await this.getChildren()).map(c => {
            if (this.dbType == DatabaseType.PG)
                return `"${c.label}"`;
            return c.label;
        });
    }

    public deleteSqlTemplate(): any {
        this
            .getChildren()
            .then((children: Node[]) => {
                const keysNames = children.filter((child: any) => child.column.key).map((child: any) => child.column.name);

                const where = keysNames.map((name: string) => `${this.wrap(name)} = \$${name}`);

                let sql = `delete from \n  ${this.wrap(this.table)} \n`;
                sql += `where \n  ${where.toString().replace(/,/g, "\n  and")}`;
                QueryUnit.showSQLTextDocument(this, sql, Template.table);
            });
    }

    public updateSqlTemplate() {
        this
            .getChildren()
            .then((children: Node[]) => {
                const keysNames = children.filter((child: any) => child.column.key).map((child: any) => child.column.name);
                const childrenNames = children.filter((child: any) => !child.column.key).map((child: any) => child.column.name);

                const sets = childrenNames.map((name: string) => `${name} = ${name}`);
                const where = keysNames.map((name: string) => `${name} = '${name}'`);

                let sql = `update \n  ${this.wrap(this.table)} \nset \n  ${sets.toString().replace(/,/g, ",\n  ")}\n`;
                sql += `where \n  ${where.toString().replace(/,/g, "\n  and ")}`;
                QueryUnit.showSQLTextDocument(this, sql, Template.table);
            });
    }

    public async getMaxPrimary(): Promise<number> {

        const primaryKey = this.primaryKey;
        if (primaryKey != null) {
            const count = await this.execute(`SELECT max(${primaryKey}) max FROM ${this.wrap(this.table)}`);
            if (count && count[0]?.max) {
                const max = count[0].max;
                return Number.isInteger(max) || max.match(/^\d+$/) ? max : 0;
            }
        }


        return Promise.resolve(0)
    }

    public copyName(): void {
        Util.copyToBoard(this.table);
    }


}
