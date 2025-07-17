class ExpenseRecord {
  final String id;
  final double amount;
  final String merchant;
  final String category;
  final DateTime timestamp;
  final String inputType; // 'image', 'audio', 'manual'
  final String? imagePath;
  final String? audioPath;
  final String? transcription;
  final Map<String, dynamic>? aiResult;
  
  ExpenseRecord({
    required this.id,
    required this.amount,
    required this.merchant,
    required this.category,
    required this.timestamp,
    required this.inputType,
    this.imagePath,
    this.audioPath,
    this.transcription,
    this.aiResult,
  });
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'amount': amount,
      'merchant': merchant,
      'category': category,
      'timestamp': timestamp.millisecondsSinceEpoch,
      'input_type': inputType,
      'image_path': imagePath,
      'audio_path': audioPath,
      'transcription': transcription,
      'ai_result': aiResult != null ? _mapToJson(aiResult!) : null,
    };
  }
  
  factory ExpenseRecord.fromMap(Map<String, dynamic> map) {
    return ExpenseRecord(
      id: map['id'] ?? '',
      amount: (map['amount'] ?? 0.0).toDouble(),
      merchant: map['merchant'] ?? '',
      category: map['category'] ?? '',
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] ?? 0),
      inputType: map['input_type'] ?? 'manual',
      imagePath: map['image_path'],
      audioPath: map['audio_path'],
      transcription: map['transcription'],
      aiResult: map['ai_result'] != null ? _jsonToMap(map['ai_result']) : null,
    );
  }
  
  static String _mapToJson(Map<String, dynamic> map) {
    // Simple JSON encoding for SQLite
    return map.entries.map((e) => '${e.key}:${e.value}').join('|');
  }
  
  static Map<String, dynamic> _jsonToMap(String json) {
    // Simple JSON decoding for SQLite
    final result = <String, dynamic>{};
    for (final entry in json.split('|')) {
      final parts = entry.split(':');
      if (parts.length == 2) {
        result[parts[0]] = parts[1];
      }
    }
    return result;
  }
}