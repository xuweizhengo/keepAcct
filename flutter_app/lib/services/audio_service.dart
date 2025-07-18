import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:permission_handler/permission_handler.dart';

class AudioService {
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  bool _isRecording = false;
  bool _isPlaying = false;
  bool _speechEnabled = false;
  String _lastWords = '';
  
  bool get isRecording => _isRecording;
  bool get isPlaying => _isPlaying;
  bool get speechEnabled => _speechEnabled;
  String get lastWords => _lastWords;
  
  Future<bool> requestMicrophonePermission() async {
    final status = await Permission.microphone.request();
    return status.isGranted;
  }
  
  Future<void> initializeSpeech() async {
    try {
      _speechEnabled = await _speechToText.initialize(
        onError: (error) {
          print('Speech recognition error: $error');
        },
        onStatus: (status) {
          print('Speech recognition status: $status');
        },
      );
    } catch (e) {
      print('Error initializing speech: $e');
      _speechEnabled = false;
    }
  }
  
  Future<void> startRecording() async {
    _isRecording = true;
    // This is a placeholder for actual audio recording
    // In a real implementation, you'd use audio recording packages
  }
  
  Future<String?> stopRecording() async {
    _isRecording = false;
    // This is a placeholder for actual audio recording
    // In a real implementation, you'd return the recorded audio file path
    return null;
  }
  
  Future<void> playAudio(String path) async {
    _isPlaying = true;
    await Future.delayed(Duration(seconds: 1));
    _isPlaying = false;
  }
  
  Future<void> stopPlaying() async {
    _isPlaying = false;
  }
  
  Future<String?> speechToText(String audioPath) async {
    // This is a placeholder for converting recorded audio to text
    // In a real implementation, you'd process the audio file
    return "转换的文本内容";
  }
  
  Future<String?> startLiveSpeechRecognition() async {
    try {
      if (!_speechEnabled) {
        await initializeSpeech();
      }
      
      if (!_speechEnabled) {
        throw Exception('语音识别未初始化');
      }
      
      if (!await requestMicrophonePermission()) {
        throw Exception('麦克风权限被拒绝');
      }
      
      _lastWords = '';
      
      await _speechToText.listen(
        onResult: (result) {
          _lastWords = result.recognizedWords;
        },
        listenFor: Duration(seconds: 30),
        pauseFor: Duration(seconds: 3),
        partialResults: true,
        localeId: 'zh_CN', // Chinese language
        cancelOnError: true,
        listenMode: stt.ListenMode.confirmation,
      );
      
      // Wait for the speech recognition to complete
      while (_speechToText.isListening) {
        await Future.delayed(Duration(milliseconds: 100));
      }
      
      return _lastWords.isNotEmpty ? _lastWords : null;
    } catch (e) {
      print('Error during live speech recognition: $e');
      throw e;
    }
  }
  
  Future<void> stopListening() async {
    if (_speechToText.isListening) {
      await _speechToText.stop();
    }
  }
  
  void dispose() {
    _speechToText.stop();
  }
}