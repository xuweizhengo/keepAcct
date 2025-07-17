import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/quick_action_menu.dart';
import '../widgets/expense_list.dart';
import '../widgets/floating_action_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _showQuickMenu = false;
  
  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        // Handle error display
        if (provider.error != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(provider.error!),
                backgroundColor: Colors.red,
                action: SnackBarAction(
                  label: '关闭',
                  textColor: Colors.white,
                  onPressed: () {
                    provider.clearError();
                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  },
                ),
              ),
            );
          });
        }
        
        return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Accounting'),
        elevation: 0,
      ),
      body: Stack(
        children: [
          // Main content
          GestureDetector(
            onDoubleTap: () {
              setState(() {
                _showQuickMenu = !_showQuickMenu;
              });
            },
            child: Container(
              width: double.infinity,
              height: double.infinity,
              child: Column(
                children: [
                  // Instructions
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: Colors.blue.shade50,
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, color: Colors.blue),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            '双击屏幕快速记账',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.blue,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Expense list
                  const Expanded(
                    child: ExpenseList(),
                  ),
                ],
              ),
            ),
          ),
          
          // Quick action menu overlay
          if (_showQuickMenu)
            QuickActionMenu(
              onClose: () {
                setState(() {
                  _showQuickMenu = false;
                });
              },
            ),
          
          // Loading overlay
          Consumer<AppProvider>(
            builder: (context, provider, _) {
              if (provider.isLoading) {
                return Container(
                  color: Colors.black.withOpacity(0.5),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                        SizedBox(height: 16),
                        Text(
                          '正在处理中...',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
      },
    );
  }
}