import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpenseRecord, User, AppSettings } from '@/types';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async init(): Promise<void> {
    return this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'SmartAccounting.db',
        location: 'default',
        createFromLocation: 1,
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 创建用户表
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT,
        preferences TEXT,
        statistics TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建消费记录表
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS expense_records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        merchant TEXT NOT NULL,
        description TEXT,
        timestamp DATETIME NOT NULL,
        confidence REAL,
        input_method TEXT,
        tags TEXT,
        raw_data TEXT,
        location TEXT,
        currency TEXT DEFAULT 'CNY',
        verified BOOLEAN DEFAULT FALSE,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 创建分类表
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        parent_id TEXT,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 创建商户表
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS merchants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        logo TEXT,
        user_id TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 创建索引
    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_expense_records_timestamp 
      ON expense_records (timestamp DESC)
    `);

    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_expense_records_category 
      ON expense_records (category)
    `);

    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_expense_records_merchant 
      ON expense_records (merchant)
    `);
  }

  // 用户相关操作
  async createUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT INTO users (id, username, email, preferences, statistics) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.email,
        JSON.stringify(user.preferences),
        JSON.stringify(user.statistics),
      ]
    );
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (results[0].rows.length === 0) return null;

    const row = results[0].rows.item(0);
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      preferences: JSON.parse(row.preferences || '{}'),
      statistics: JSON.parse(row.statistics || '{}'),
    };
  }

  // 消费记录相关操作
  async insertExpenseRecord(record: ExpenseRecord): Promise<void> {
    return this.saveExpenseRecord(record);
  }

  async saveExpenseRecord(record: ExpenseRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT OR REPLACE INTO expense_records 
       (id, amount, category, merchant, description, timestamp, confidence, 
        input_method, tags, raw_data, location, currency, verified, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.amount,
        record.category,
        record.merchant,
        record.description,
        record.timestamp,
        record.confidence,
        record.inputMethod,
        JSON.stringify(record.tags),
        JSON.stringify(record.rawData),
        record.location || null,
        record.currency,
        record.verified,
        record.syncStatus,
      ]
    );
  }

  async getExpenseRecords(options: {
    limit?: number;
    offset?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ExpenseRecord[]> {
    const { limit = 50, offset = 0, category, startDate, endDate } = options;
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM expense_records WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await this.db.executeSql(query, params);
    const records: ExpenseRecord[] = [];

    for (let i = 0; i < results[0].rows.length; i++) {
      const row = results[0].rows.item(i);
      records.push({
        id: row.id,
        amount: row.amount,
        category: row.category,
        merchant: row.merchant,
        description: row.description,
        timestamp: row.timestamp,
        confidence: row.confidence,
        inputMethod: row.input_method,
        tags: JSON.parse(row.tags || '[]'),
        rawData: JSON.parse(row.raw_data || '{}'),
        location: row.location,
        currency: row.currency,
        verified: Boolean(row.verified),
        syncStatus: row.sync_status,
      });
    }

    return records;
  }

  async getExpenseRecordById(id: string): Promise<ExpenseRecord | null> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(
      'SELECT * FROM expense_records WHERE id = ?',
      [id]
    );

    if (results[0].rows.length === 0) return null;

    const row = results[0].rows.item(0);
    return {
      id: row.id,
      amount: row.amount,
      category: row.category,
      merchant: row.merchant,
      description: row.description,
      timestamp: row.timestamp,
      confidence: row.confidence,
      inputMethod: row.input_method,
      tags: JSON.parse(row.tags || '[]'),
      rawData: JSON.parse(row.raw_data || '{}'),
      location: row.location,
      currency: row.currency,
      verified: Boolean(row.verified),
      syncStatus: row.sync_status,
    };
  }

  async updateExpenseRecord(record: ExpenseRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `UPDATE expense_records SET 
       amount = ?, category = ?, merchant = ?, description = ?, 
       timestamp = ?, confidence = ?, input_method = ?, tags = ?, 
       raw_data = ?, location = ?, currency = ?, verified = ?, 
       sync_status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        record.amount,
        record.category,
        record.merchant,
        record.description,
        record.timestamp,
        record.confidence,
        record.inputMethod,
        JSON.stringify(record.tags),
        JSON.stringify(record.rawData),
        record.location || null,
        record.currency,
        record.verified,
        record.syncStatus,
        record.id,
      ]
    );
  }

  async deleteExpenseRecord(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM expense_records WHERE id = ?', [id]);
  }

  // 统计相关操作
  async getExpenseStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalAmount: number;
    totalRecords: number;
    categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
    merchantBreakdown: Array<{ merchant: string; amount: number; count: number }>;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      whereClause += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND timestamp <= ?';
      params.push(endDate);
    }

    // 总金额和记录数
    const totalResults = await this.db.executeSql(
      `SELECT SUM(amount) as totalAmount, COUNT(*) as totalRecords 
       FROM expense_records ${whereClause}`,
      params
    );

    const totalRow = totalResults[0].rows.item(0);
    const totalAmount = totalRow.totalAmount || 0;
    const totalRecords = totalRow.totalRecords || 0;

    // 分类统计
    const categoryResults = await this.db.executeSql(
      `SELECT category, SUM(amount) as amount, COUNT(*) as count 
       FROM expense_records ${whereClause} 
       GROUP BY category ORDER BY amount DESC`,
      params
    );

    const categoryBreakdown = [];
    for (let i = 0; i < categoryResults[0].rows.length; i++) {
      const row = categoryResults[0].rows.item(i);
      categoryBreakdown.push({
        category: row.category,
        amount: row.amount,
        count: row.count,
      });
    }

    // 商户统计
    const merchantResults = await this.db.executeSql(
      `SELECT merchant, SUM(amount) as amount, COUNT(*) as count 
       FROM expense_records ${whereClause} 
       GROUP BY merchant ORDER BY amount DESC LIMIT 10`,
      params
    );

    const merchantBreakdown = [];
    for (let i = 0; i < merchantResults[0].rows.length; i++) {
      const row = merchantResults[0].rows.item(i);
      merchantBreakdown.push({
        merchant: row.merchant,
        amount: row.amount,
        count: row.count,
      });
    }

    return {
      totalAmount,
      totalRecords,
      categoryBreakdown,
      merchantBreakdown,
    };
  }

  // 关闭数据库连接
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// 全局单例
export const databaseService = DatabaseService.getInstance();