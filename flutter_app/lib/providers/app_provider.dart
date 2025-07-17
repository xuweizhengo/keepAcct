import 'package:flutter/material.dart';
import '../models/expense_record.dart';
import '../services/database_service.dart';
import '../services/ai_service.dart';
import '../services/image_service.dart';
import '../services/audio_service.dart';

class AppProvider extends ChangeNotifier {
  final DatabaseService _databaseService = DatabaseService();
  final AIService _aiService = AIService();
  final ImageService _imageService = ImageService();
  final AudioService _audioService = AudioService();
  
  List<ExpenseRecord> _records = [];
  bool _isLoading = false;
  String? _error;
  
  List<ExpenseRecord> get records => _records;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  AppProvider() {
    _initializeServices();
  }
  
  Future<void> _initializeServices() async {
    await _databaseService.initialize();
    await _loadRecords();
  }
  
  Future<void> _loadRecords() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      _records = await _databaseService.getAllRecords();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load records: $e';
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> processImageRecord(String imagePath) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      // Process image with AI
      final result = await _aiService.processImage(imagePath);
      
      // Create expense record
      final record = ExpenseRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        amount: result?['amount'] ?? 0.0,
        merchant: result?['merchant'] ?? 'Unknown',
        category: result?['category'] ?? 'Other',
        timestamp: DateTime.now(),
        inputType: 'image',
        imagePath: imagePath,
        aiResult: result,
      );
      
      // Save to database
      await _databaseService.insertRecord(record);
      
      // Reload records
      await _loadRecords();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to process image: $e';
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> processAudioRecord(String audioPath) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      // Convert audio to text
      final text = await _audioService.speechToText(audioPath);
      
      // Process with AI
      final result = await _aiService.processText(text ?? '');
      
      // Create expense record
      final record = ExpenseRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        amount: result?['amount'] ?? 0.0,
        merchant: result?['merchant'] ?? 'Unknown',
        category: result?['category'] ?? 'Other',
        timestamp: DateTime.now(),
        inputType: 'audio',
        audioPath: audioPath,
        transcription: text,
        aiResult: result,
      );
      
      // Save to database
      await _databaseService.insertRecord(record);
      
      // Reload records
      await _loadRecords();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to process audio: $e';
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> deleteRecord(String id) async {
    try {
      await _databaseService.deleteRecord(id);
      await _loadRecords();
    } catch (e) {
      _error = 'Failed to delete record: $e';
      notifyListeners();
    }
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}