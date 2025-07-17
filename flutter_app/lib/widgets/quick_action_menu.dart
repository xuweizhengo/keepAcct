import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/image_service.dart';
import '../services/audio_service.dart';

class QuickActionMenu extends StatefulWidget {
  final VoidCallback onClose;
  
  const QuickActionMenu({
    Key? key,
    required this.onClose,
  }) : super(key: key);

  @override
  State<QuickActionMenu> createState() => _QuickActionMenuState();
}

class _QuickActionMenuState extends State<QuickActionMenu>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  
  final ImageService _imageService = ImageService();
  final AudioService _audioService = AudioService();
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _animationController.forward();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onClose,
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          '快速记账',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _buildActionButton(
                              icon: Icons.camera_alt,
                              label: '拍照记账',
                              color: Colors.blue,
                              onTap: _handleCameraAction,
                            ),
                            _buildActionButton(
                              icon: Icons.mic,
                              label: '语音记账',
                              color: Colors.green,
                              onTap: _handleVoiceAction,
                            ),
                            _buildActionButton(
                              icon: Icons.photo_library,
                              label: '截屏记账',
                              color: Colors.orange,
                              onTap: _handleGalleryAction,
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: widget.onClose,
                          child: const Text(
                            '取消',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
  
  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 48,
              color: color,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _handleCameraAction() async {
    widget.onClose();
    
    try {
      final imagePath = await _imageService.pickImageFromCamera();
      if (imagePath != null) {
        if (mounted) {
          context.read<AppProvider>().processImageRecord(imagePath);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('相机错误: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  void _handleVoiceAction() async {
    widget.onClose();
    
    try {
      // Start live speech recognition
      final text = await _audioService.startLiveSpeechRecognition();
      if (text?.isNotEmpty == true) {
        if (mounted) {
          // Process the recognized text
          final provider = context.read<AppProvider>();
          // Create a temporary audio path for the transcription
          await provider.processAudioRecord('live_recognition');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('语音识别错误: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  void _handleGalleryAction() async {
    widget.onClose();
    
    try {
      final imagePath = await _imageService.pickImageFromGallery();
      if (imagePath != null) {
        if (mounted) {
          context.read<AppProvider>().processImageRecord(imagePath);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('图片选择错误: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}