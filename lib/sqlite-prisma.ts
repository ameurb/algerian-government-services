// Use sqlite3 directly for better compatibility
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'db', 'dev.db');

// SQLite database wrapper
export class SQLiteService {
  private db: any;
  
  constructor() {
    this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  }
  
  // Query Arabic services
  async queryArabicServices(searchTerms: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const placeholders = searchTerms.map(() => '?').join(',');
      const conditions = searchTerms.map(() => 
        `(title LIKE ? OR content LIKE ? OR summary LIKE ? OR categoryName LIKE ? OR OrganizationConcerned LIKE ?)`
      ).join(' OR ');
      
      const values = searchTerms.flatMap(term => Array(5).fill(`%${term}%`));
      
      const query = `
        SELECT * FROM services_arabic 
        WHERE ${conditions}
        ORDER BY id DESC 
        LIMIT 8
      `;
      
      this.db.all(query, values, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  
  // Query French services
  async queryFrenchServices(searchTerms: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const conditions = searchTerms.map(() => 
        `(title LIKE ? OR content LIKE ? OR summary LIKE ? OR categoryName LIKE ? OR OrganizationConcerned LIKE ?)`
      ).join(' OR ');
      
      const values = searchTerms.flatMap(term => Array(5).fill(`%${term}%`));
      
      const query = `
        SELECT * FROM services_french 
        WHERE ${conditions}
        ORDER BY id DESC 
        LIMIT 8
      `;
      
      this.db.all(query, values, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  
  // Query English services
  async queryEnglishServices(searchTerms: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const conditions = searchTerms.map(() => 
        `(title LIKE ? OR content LIKE ? OR summary LIKE ? OR categoryName LIKE ? OR OrganizationConcerned LIKE ?)`
      ).join(' OR ');
      
      const values = searchTerms.flatMap(term => Array(5).fill(`%${term}%`));
      
      const query = `
        SELECT * FROM services_english 
        WHERE ${conditions}
        ORDER BY id DESC 
        LIMIT 8
      `;
      
      this.db.all(query, values, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  
  // Get categories
  async getCategories(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM categories ORDER BY categoryId', [], (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  
  close() {
    this.db.close();
  }
}

export const sqliteService = new SQLiteService();