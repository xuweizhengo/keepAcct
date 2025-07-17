import '../models/expense_record.dart';

class DatabaseService {
  static final List<ExpenseRecord> _records = [];
  
  Future<void> initialize() async {
    // No-op for simplified version
  }
  
  Future<void> insertRecord(ExpenseRecord record) async {
    // Simplified in-memory storage
    _records.add(record);
  }
  
  Future<void> insertExpenseRecord(ExpenseRecord record) async {
    await insertRecord(record);
  }
  
  Future<List<ExpenseRecord>> getAllRecords() async {
    return await getExpenseRecords();
  }
  
  Future<List<ExpenseRecord>> getExpenseRecords() async {
    // Return mock data for demo
    if (_records.isEmpty) {
      _records.addAll([
        ExpenseRecord(
          id: '1',
          amount: 25.80,
          merchant: '星巴克咖啡',
          category: '餐饮',
          timestamp: DateTime.now().subtract(Duration(hours: 2)),
          inputType: 'manual',
        ),
        ExpenseRecord(
          id: '2',
          amount: 128.00,
          merchant: '滴滴出行',
          category: '交通',
          timestamp: DateTime.now().subtract(Duration(hours: 5)),
          inputType: 'manual',
        ),
      ]);
    }
    return List.from(_records);
  }
  
  Future<void> updateExpenseRecord(ExpenseRecord record) async {
    final index = _records.indexWhere((r) => r.id == record.id);
    if (index != -1) {
      _records[index] = record;
    }
  }
  
  Future<void> deleteRecord(String id) async {
    _records.removeWhere((record) => record.id == id);
  }
  
  Future<void> deleteExpenseRecord(String id) async {
    await deleteRecord(id);
  }
  
  Future<void> close() async {
    // No-op for simplified version
  }
}