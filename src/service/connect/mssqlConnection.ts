import { Connection, ConnectionConfig, Request } from "@/bin/tedious";
import { ConnectionError } from 'tedious'
import { Node } from "@/model/interface/node";
import { EventEmitter } from "events";
import { queryCallback } from "./connection";
import { ConnectionPool } from "./pool/connectionPool";
import format = require('date-format');

/**
 * tedious not support connection queue, so need using pool.
 * http://tediousjs.github.io/tedious/getting-started.html
 */
export class MSSqlConnnection extends ConnectionPool<Connection>{
    private config: ConnectionConfig;
    constructor(node: Node) {
        super()
        this.config = {
            server: node.host,
            options: {
                port: node.instanceName?undefined:parseInt(node.port as any),
                instanceName: node.instanceName,
                useUTC: false,
                trustServerCertificate: true,
                database: node.database || undefined,
                connectTimeout: node.connectTimeout ? parseInt(node.connectTimeout as any) : 5000,
                requestTimeout: node.requestTimeout ? parseInt(node.requestTimeout as any) : 30000,
                encrypt: node.encrypt
            },
            authentication: {
                type: node.authType,
                options: {
                    domain: node.domain,
                    userName: node.user,
                    password: node.password,
                }
            }
        };
    }
    query(sql: string, callback?: queryCallback): void;
    query(sql: string, values: any, callback?: queryCallback): void;
    query(sql: any, values?: any, callback?: any) {
        if (!callback && values instanceof Function) {
            callback = values;
        }
        let fields = [];
        let datas = [];

        const event = new EventEmitter()

        this.getConnection(poolConnection => {

            let tempDatas = [];
            let columnCount = 0;
            const connection = poolConnection.actual;

            const isDML = sql.match(/^\s*\b(insert|update|delete)\b/i)
            connection.execSql(new Request(sql, err => {
                const multi = columnCount > 1;
                event.emit("end")
                if (callback) {
                    if (err) {
                        callback(err, null)
                    } else if (isDML) {
                        callback(null, { affectedRows: datas.length })
                    } else {
                        if (multi) datas.push(tempDatas)
                        callback(null, multi ? datas : tempDatas, multi ? fields : fields[0] || [])
                    }
                }
                this.release(poolConnection)
            }).on('columnMetadata', (columns) => {
                columnCount++;
                let tempFields = []
                columns.forEach((column) => {
                    tempFields.push({
                        name: column.colName,
                        orgTable: ((column) as any).tableName
                    })
                });
                fields.push(tempFields)
                if (columnCount > 1) {
                    datas.push(tempDatas)
                    tempDatas = []
                }
            }).on('row', columns => {
                let temp = {};
                columns.forEach((column) => {
                    temp[column.metadata.colName] = column.value
                    if (column.value instanceof Date) {
                        temp[column.metadata.colName] = format("yyyy-MM-dd hh:mm:ss", column.value)
                    }
                    if (this.dumpMode) {
                        temp[column.metadata.colName] = temp[column.metadata.colName]!=null?`'${temp[column.metadata.colName]}'`:"null"
                    }
                });
                if (!callback) {
                    event.emit("result", temp)
                    return;
                }
                tempDatas.push(temp)
            }))

        })
        return event;
    }
    connect(callback: (err: Error) => void): void {
        try {
            const con = new Connection(this.config)
            con.on("connect", err => {
                callback(err)
                if (!err) {
                    this.fill()
                }
            }).on("error", err => {
                callback(err)
            })
        } catch (error) {
            callback(error)
        }
    }

    protected newConnection(callback: (err: Error, connection: Connection) => void): void {
        const connection = new Connection(this.config)
        connection.on("connect", err => {
            callback(err, connection)
        })
    }
    async beginTransaction(callback: (err: Error) => void) {
        const connection = await this.getConnection();
        connection.actual.beginTransaction((err) => {
            callback(err)
            this.release(connection)
        })
    }
    async rollback() {
        const connection = await this.getConnection();
        connection.actual.rollbackTransaction(() => {
            this.release(connection)
        })
    }
    async commit() {
        const connection = await this.getConnection();
        connection.actual.commitTransaction(() => {
            this.release(connection)
        })
    }
}