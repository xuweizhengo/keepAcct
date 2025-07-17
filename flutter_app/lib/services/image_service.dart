import 'dart:io';
import 'package:flutter/material.dart';

class ImageService {
  Future<String?> pickImageFromCamera() async {
    // Placeholder - camera not available in simplified version
    return null;
  }
  
  Future<String?> pickImageFromGallery() async {
    // Placeholder - gallery not available in simplified version
    return null;
  }
  
  Future<List<String>> pickMultipleImages() async {
    // Placeholder - multiple images not available in simplified version
    return [];
  }
  
  Future<void> showImagePickerDialog(
    context, {
    required Function(String) onImageSelected,
  }) async {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera),
                title: const Text('拍照'),
                onTap: () async {
                  Navigator.pop(context);
                  final imagePath = await pickImageFromCamera();
                  if (imagePath != null) {
                    onImageSelected(imagePath);
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('从相册选择'),
                onTap: () async {
                  Navigator.pop(context);
                  final imagePath = await pickImageFromGallery();
                  if (imagePath != null) {
                    onImageSelected(imagePath);
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.cancel),
                title: const Text('取消'),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }
  
  Future<bool> deleteImage(String imagePath) async {
    try {
      final file = File(imagePath);
      if (await file.exists()) {
        await file.delete();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}