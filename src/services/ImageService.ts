import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import RNFS from 'react-native-fs';

export interface ImageResult {
  success: boolean;
  data?: {
    uri: string;
    fileName: string;
    fileSize: number;
    type: string;
    base64?: string;
  };
  error?: string;
}

export class ImageService {
  private static instance: ImageService;

  static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  private async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: '相机权限',
            message: '智能记账需要相机权限来拍照记账',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Camera permission request error:', err);
        return false;
      }
    } else {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      return result === RESULTS.GRANTED;
    }
  }

  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: '存储权限',
            message: '智能记账需要存储权限来选择照片',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Storage permission request error:', err);
        return false;
      }
    } else {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return result === RESULTS.GRANTED;
    }
  }

  private getImagePickerOptions() {
    return {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 2048,
      maxHeight: 2048,
      includeBase64: true,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
  }

  async openCamera(): Promise<ImageResult> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      return {
        success: false,
        error: '相机权限被拒绝',
      };
    }

    return new Promise((resolve) => {
      launchCamera(this.getImagePickerOptions(), (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve({
            success: false,
            error: '用户取消了拍照',
          });
        } else if (response.errorMessage) {
          resolve({
            success: false,
            error: response.errorMessage,
          });
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          resolve({
            success: true,
            data: {
              uri: asset.uri || '',
              fileName: asset.fileName || 'camera_image.jpg',
              fileSize: asset.fileSize || 0,
              type: asset.type || 'image/jpeg',
              base64: asset.base64,
            },
          });
        } else {
          resolve({
            success: false,
            error: '拍照失败',
          });
        }
      });
    });
  }

  async openImageLibrary(): Promise<ImageResult> {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      return {
        success: false,
        error: '存储权限被拒绝',
      };
    }

    return new Promise((resolve) => {
      launchImageLibrary(this.getImagePickerOptions(), (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve({
            success: false,
            error: '用户取消了选择',
          });
        } else if (response.errorMessage) {
          resolve({
            success: false,
            error: response.errorMessage,
          });
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          resolve({
            success: true,
            data: {
              uri: asset.uri || '',
              fileName: asset.fileName || 'selected_image.jpg',
              fileSize: asset.fileSize || 0,
              type: asset.type || 'image/jpeg',
              base64: asset.base64,
            },
          });
        } else {
          resolve({
            success: false,
            error: '选择图片失败',
          });
        }
      });
    });
  }

  async showImagePicker(): Promise<ImageResult> {
    return new Promise((resolve) => {
      Alert.alert(
        '选择图片',
        '请选择图片来源',
        [
          {
            text: '取消',
            style: 'cancel',
            onPress: () => resolve({
              success: false,
              error: '用户取消了选择',
            }),
          },
          {
            text: '拍照',
            onPress: async () => {
              const result = await this.openCamera();
              resolve(result);
            },
          },
          {
            text: '从相册选择',
            onPress: async () => {
              const result = await this.openImageLibrary();
              resolve(result);
            },
          },
        ],
        { cancelable: true }
      );
    });
  }

  async convertImageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await RNFS.readFile(uri, 'base64');
      return base64;
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error('图片转换失败');
    }
  }

  async saveImageToLocal(uri: string, fileName: string): Promise<string> {
    try {
      const documentsPath = RNFS.DocumentDirectoryPath;
      const imagesPath = `${documentsPath}/images`;
      
      // 确保目录存在
      await RNFS.mkdir(imagesPath);
      
      const filePath = `${imagesPath}/${fileName}`;
      await RNFS.copyFile(uri, filePath);
      
      return filePath;
    } catch (error) {
      console.error('Save image error:', error);
      throw new Error('保存图片失败');
    }
  }

  async getImageInfo(uri: string): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  }> {
    try {
      const fileInfo = await RNFS.stat(uri);
      return {
        width: 0, // 需要其他库来获取图片尺寸
        height: 0,
        size: fileInfo.size,
        type: 'image/jpeg',
      };
    } catch (error) {
      console.error('Get image info error:', error);
      throw new Error('获取图片信息失败');
    }
  }

  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    // 这里可以集成图片压缩库，如 react-native-image-resizer
    // 暂时返回原始URI
    return uri;
  }

  async deleteImage(uri: string): Promise<boolean> {
    try {
      await RNFS.unlink(uri);
      return true;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }

  validateImageFormat(fileName: string): boolean {
    const supportedFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? supportedFormats.includes(extension) : false;
  }

  validateImageSize(fileSize: number, maxSize: number = 10 * 1024 * 1024): boolean {
    return fileSize <= maxSize;
  }
}