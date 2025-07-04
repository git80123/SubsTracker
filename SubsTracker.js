// 订阅续期通知网站 - 基于CloudFlare Workers (完全优化版)

// 定义HTML模板
const loginPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订阅管理系统</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .login-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .login-box {
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: all 0.3s;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .input-field {
      transition: all 0.3s;
      border: 1px solid #e2e8f0;
    }
    .input-field:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
    }
  </style>
</head>
<body class="login-container flex items-center justify-center">
  <div class="login-box p-8 rounded-xl w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-calendar-check mr-2"></i>订阅管理系统</h1>
      <p class="text-gray-600 mt-2">登录管理您的订阅提醒</p>
    </div>
    
    <form id="loginForm" class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-user mr-2"></i>用户名
        </label>
        <input type="text" id="username" name="username" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-lock mr-2"></i>密码
        </label>
        <input type="password" id="password" name="password" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <button type="submit" 
        class="btn-primary w-full py-3 rounded-lg text-white font-medium focus:outline-none">
        <i class="fas fa-sign-in-alt mr-2"></i>登录
      </button>
      
      <div id="errorMsg" class="text-red-500 text-center"></div>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const button = e.target.querySelector('button');
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登录中...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.location.href = '/admin';
        } else {
          document.getElementById('errorMsg').textContent = result.message || '用户名或密码错误';
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        document.getElementById('errorMsg').textContent = '发生错误，请稍后再试';
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    });
  </script>
</body>
</html>
`;

const adminPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订阅管理系统</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-danger { background: linear-gradient(135deg, #f87171 0%, #dc2626 100%); transition: all 0.3s; }
    .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-success { background: linear-gradient(135deg, #34d399 0%, #059669 100%); transition: all 0.3s; }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-warning { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); transition: all 0.3s; }
    .btn-warning:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-info { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); transition: all 0.3s; }
    .btn-info:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .table-container { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .modal-container { backdrop-filter: blur(8px); }
    .readonly-input { background-color: #f8fafc; border-color: #e2e8f0; cursor: not-allowed; }
    .error-message { font-size: 0.875rem; margin-top: 0.25rem; display: none; }
    .error-message.show { display: block; }
    
    /* Toast 样式 */
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
      color: white; font-weight: 500; z-index: 1000; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">订阅管理系统</span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>订阅列表
          </a>
          <a href="/admin/config" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-cog mr-1"></i>系统配置
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登录
          </a>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">订阅列表</h2>
      <div class="flex space-x-2">
        <button id="addSubscriptionBtn" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <i class="fas fa-plus mr-2"></i>添加新订阅
        </button>
      </div>
    </div>
    
    <div class="table-container bg-white rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              到期时间 <i class="fas fa-sort-up ml-1 text-indigo-500" title="按到期时间升序排列"></i>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提醒设置</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody id="subscriptionsBody" class="bg-white divide-y divide-gray-200">
        </tbody>
      </table>
    </div>
  </div>

  <!-- 添加/编辑订阅的模态框 -->
  <div id="subscriptionModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 modal-container hidden flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h3 id="modalTitle" class="text-lg font-medium text-gray-900">添加新订阅</h3>
          <button id="closeModal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>
      
      <form id="subscriptionForm" class="p-6 space-y-6">
        <input type="hidden" id="subscriptionId">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">订阅名称 *</label>
            <input type="text" id="name" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="customType" class="block text-sm font-medium text-gray-700 mb-1">订阅类型</label>
            <input type="text" id="customType" placeholder="例如：流媒体、云服务、软件等"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input type="date" id="startDate"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="periodValue" class="block text-sm font-medium text-gray-700 mb-1">周期数值 *</label>
            <input type="number" id="periodValue" min="1" value="1" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="periodUnit" class="block text-sm font-medium text-gray-700 mb-1">周期单位 *</label>
            <select id="periodUnit" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="day">天</option>
              <option value="month" selected>月</option>
              <option value="year">年</option>
            </select>
            <div class="error-message text-red-500"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="expiryDate" class="block text-sm font-medium text-gray-700 mb-1">到期日期 *</label>
            <input type="date" id="expiryDate" required
              class="readonly-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div class="flex items-end">
            <button type="button" id="calculateExpiryBtn" 
              class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium h-10">
              <i class="fas fa-calculator mr-2"></i>自动计算到期日期
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="reminderDays" class="block text-sm font-medium text-gray-700 mb-1">提前提醒天数</label>
            <input type="number" id="reminderDays" min="0" value="7"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <p class="text-xs text-gray-500 mt-1">0 = 仅到期日当天提醒，1+ = 提前N天开始提醒</p>
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">选项设置</label>
            <div class="space-y-2">
              <label class="inline-flex items-center">
                <input type="checkbox" id="isActive" checked 
                  class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">启用订阅</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" id="autoRenew" checked 
                  class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">自动续订</span>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea id="notes" rows="3" placeholder="可添加相关备注信息..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          <div class="error-message text-red-500"></div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" id="cancelBtn" 
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button type="submit" 
            class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-save mr-2"></i>保存
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }

    function showFieldError(fieldId, message) {
      const field = document.getElementById(fieldId);
      const errorDiv = field.parentElement.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        field.classList.add('border-red-500');
      }
    }

    function clearFieldErrors() {
      document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
      });
      document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
      });
    }

    function validateForm() {
      clearFieldErrors();
      let isValid = true;

      const name = document.getElementById('name').value.trim();
      if (!name) {
        showFieldError('name', '请输入订阅名称');
        isValid = false;
      }

      const periodValue = document.getElementById('periodValue').value;
      if (!periodValue || periodValue < 1) {
        showFieldError('periodValue', '周期数值必须大于0');
        isValid = false;
      }

      const expiryDate = document.getElementById('expiryDate').value;
      if (!expiryDate) {
        showFieldError('expiryDate', '请选择到期日期');
        isValid = false;
      }

      const reminderDays = document.getElementById('reminderDays').value;
      if (reminderDays === '' || reminderDays < 0) {
        showFieldError('reminderDays', '提醒天数不能为负数');
        isValid = false;
      }

      return isValid;
    }

    // 获取所有订阅并按到期时间排序
    async function loadSubscriptions() {
      try {
        const tbody = document.getElementById('subscriptionsBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</td></tr>';
        
        const response = await fetch('/api/subscriptions');
        const data = await response.json();
        
        tbody.innerHTML = '';
        
        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">没有订阅数据</td></tr>';
          return;
        }
        
        // 按到期时间升序排序（最早到期的在前）
        data.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        
        data.forEach(subscription => {
          const row = document.createElement('tr');
          row.className = subscription.isActive === false ? 'hover:bg-gray-50 bg-gray-100' : 'hover:bg-gray-50';
          
          const expiryDate = new Date(subscription.expiryDate);
          const now = new Date();
          const daysDiff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          let statusHtml = '';
          if (!subscription.isActive) {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-gray-500"><i class="fas fa-pause-circle mr-1"></i>已停用</span>';
          } else if (daysDiff < 0) {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-red-500"><i class="fas fa-exclamation-circle mr-1"></i>已过期</span>';
          } else if (daysDiff <= (subscription.reminderDays || 7)) {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-yellow-500"><i class="fas fa-exclamation-triangle mr-1"></i>即将到期</span>';
          } else {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-green-500"><i class="fas fa-check-circle mr-1"></i>正常</span>';
          }
          
          let periodText = '';
          if (subscription.periodValue && subscription.periodUnit) {
            const unitMap = { day: '天', month: '月', year: '年' };
            periodText = subscription.periodValue + ' ' + (unitMap[subscription.periodUnit] || subscription.periodUnit);
          }
          
          const autoRenewIcon = subscription.autoRenew !== false ? 
            '<i class="fas fa-sync-alt text-blue-500 ml-1" title="自动续订"></i>' : 
            '<i class="fas fa-ban text-gray-400 ml-1" title="不自动续订"></i>';
          
          row.innerHTML = 
            '<td class="px-6 py-4 whitespace-nowrap">' + 
              '<div class="text-sm font-medium text-gray-900">' + subscription.name + '</div>' +
              (subscription.notes ? '<div class="text-xs text-gray-500">' + subscription.notes + '</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap">' + 
              '<div class="text-sm text-gray-900">' + 
                '<i class="fas fa-tag mr-1"></i>' + (subscription.customType || '其他') + 
              '</div>' +
              (periodText ? '<div class="text-xs text-gray-500">周期: ' + periodText + autoRenewIcon + '</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap">' + 
              '<div class="text-sm text-gray-900">' + new Date(subscription.expiryDate).toLocaleDateString() + '</div>' +
              '<div class="text-xs text-gray-500">' + (daysDiff < 0 ? '已过期' + Math.abs(daysDiff) + '天' : '还剩' + daysDiff + '天') + '</div>' +
              (subscription.startDate ? '<div class="text-xs text-gray-500">开始: ' + new Date(subscription.startDate).toLocaleDateString() + '</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + 
              '<div><i class="fas fa-bell mr-1"></i>提前' + (subscription.reminderDays || 0) + '天</div>' +
              (subscription.reminderDays === 0 ? '<div class="text-xs text-gray-500">仅到期日提醒</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap">' + statusHtml + '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
              '<div class="flex flex-wrap gap-1">' +
                '<button class="edit btn-primary text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-edit mr-1"></i>编辑</button>' +
                '<button class="test-notify btn-info text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-paper-plane mr-1"></i>测试</button>' +
                '<button class="delete btn-danger text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-trash-alt mr-1"></i>删除</button>' +
                (subscription.isActive ? 
                  '<button class="toggle-status btn-warning text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '" data-action="deactivate"><i class="fas fa-pause-circle mr-1"></i>停用</button>' : 
                  '<button class="toggle-status btn-success text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '" data-action="activate"><i class="fas fa-play-circle mr-1"></i>启用</button>') +
              '</div>' +
            '</td>';
          
          tbody.appendChild(row);
        });
        
        document.querySelectorAll('.edit').forEach(button => {
          button.addEventListener('click', editSubscription);
        });
        
        document.querySelectorAll('.delete').forEach(button => {
          button.addEventListener('click', deleteSubscription);
        });
        
        document.querySelectorAll('.toggle-status').forEach(button => {
          button.addEventListener('click', toggleSubscriptionStatus);
        });

        document.querySelectorAll('.test-notify').forEach(button => {
          button.addEventListener('click', testSubscriptionNotification);
        });
      } catch (error) {
        console.error('加载订阅失败:', error);
        const tbody = document.getElementById('subscriptionsBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>加载失败，请刷新页面重试</td></tr>';
        showToast('加载订阅列表失败', 'error');
      }
    }
    
    async function testSubscriptionNotification(e) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
        const id = button.dataset.id;
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>';
        button.disabled = true;

        try {
            const response = await fetch('/api/subscriptions/' + id + '/test-notify', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                showToast(result.message || '测试通知已发送', 'success');
            } else {
                showToast(result.message || '测试通知发送失败', 'error');
            }
        } catch (error) {
            console.error('测试通知失败:', error);
            showToast('发送测试通知时发生错误', 'error');
        } finally {
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }
    
    async function toggleSubscriptionStatus(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      const action = e.target.dataset.action || e.target.parentElement.dataset.action;
      const isActivate = action === 'activate';
      
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (isActivate ? '启用中...' : '停用中...');
      button.disabled = true;
      
      try {
        const response = await fetch('/api/subscriptions/' + id + '/toggle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: isActivate })
        });
        
        if (response.ok) {
          showToast((isActivate ? '启用' : '停用') + '成功', 'success');
          loadSubscriptions();
        } else {
          const error = await response.json();
          showToast((isActivate ? '启用' : '停用') + '失败: ' + (error.message || '未知错误'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error((isActivate ? '启用' : '停用') + '订阅失败:', error);
        showToast((isActivate ? '启用' : '停用') + '失败，请稍后再试', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('addSubscriptionBtn').addEventListener('click', () => {
      document.getElementById('modalTitle').textContent = '添加新订阅';
      document.getElementById('subscriptionModal').classList.remove('hidden');
      
      document.getElementById('subscriptionForm').reset();
      document.getElementById('subscriptionId').value = '';
      clearFieldErrors();
      
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('startDate').value = today;
      document.getElementById('reminderDays').value = '7';
      document.getElementById('isActive').checked = true;
      document.getElementById('autoRenew').checked = true;
      
      calculateExpiryDate();
      setupModalEventListeners();
    });
    
    function setupModalEventListeners() {
      document.getElementById('calculateExpiryBtn').removeEventListener('click', calculateExpiryDate);
      document.getElementById('calculateExpiryBtn').addEventListener('click', calculateExpiryDate);
      
      ['startDate', 'periodValue', 'periodUnit'].forEach(id => {
        const element = document.getElementById(id);
        element.removeEventListener('change', calculateExpiryDate);
        element.addEventListener('change', calculateExpiryDate);
      });
      
      document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('subscriptionModal').classList.add('hidden');
      });
    }
    
    function calculateExpiryDate() {
      const startDate = document.getElementById('startDate').value;
      const periodValue = parseInt(document.getElementById('periodValue').value);
      const periodUnit = document.getElementById('periodUnit').value;
      
      if (!startDate || !periodValue || !periodUnit) {
        return;
      }
      
      const start = new Date(startDate);
      const expiry = new Date(start);
      
      if (periodUnit === 'day') {
        expiry.setDate(start.getDate() + periodValue);
      } else if (periodUnit === 'month') {
        expiry.setMonth(start.getMonth() + periodValue);
      } else if (periodUnit === 'year') {
        expiry.setFullYear(start.getFullYear() + periodValue);
      }
      
      document.getElementById('expiryDate').value = expiry.toISOString().split('T')[0];
    }
    
    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('subscriptionModal').classList.add('hidden');
    });
    
    document.getElementById('subscriptionModal').addEventListener('click', (event) => {
      if (event.target === document.getElementById('subscriptionModal')) {
        document.getElementById('subscriptionModal').classList.add('hidden');
      }
    });
    
    document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      const id = document.getElementById('subscriptionId').value;
      const subscription = {
        name: document.getElementById('name').value.trim(),
        customType: document.getElementById('customType').value.trim(),
        notes: document.getElementById('notes').value.trim() || '',
        isActive: document.getElementById('isActive').checked,
        autoRenew: document.getElementById('autoRenew').checked,
        startDate: document.getElementById('startDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        periodValue: parseInt(document.getElementById('periodValue').value),
        periodUnit: document.getElementById('periodUnit').value,
        reminderDays: parseInt(document.getElementById('reminderDays').value) || 0
      };
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (id ? '更新中...' : '保存中...');
      submitButton.disabled = true;
      
      try {
        const url = id ? '/api/subscriptions/' + id : '/api/subscriptions';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast((id ? '更新' : '添加') + '订阅成功', 'success');
          document.getElementById('subscriptionModal').classList.add('hidden');
          loadSubscriptions();
        } else {
          showToast((id ? '更新' : '添加') + '订阅失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error((id ? '更新' : '添加') + '订阅失败:', error);
        showToast((id ? '更新' : '添加') + '订阅失败，请稍后再试', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
    async function editSubscription(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      
      try {
        const response = await fetch('/api/subscriptions/' + id);
        const subscription = await response.json();
        
        if (subscription) {
          document.getElementById('modalTitle').textContent = '编辑订阅';
          document.getElementById('subscriptionId').value = subscription.id;
          document.getElementById('name').value = subscription.name;
          document.getElementById('customType').value = subscription.customType || '';
          document.getElementById('notes').value = subscription.notes || '';
          document.getElementById('isActive').checked = subscription.isActive !== false;
          document.getElementById('autoRenew').checked = subscription.autoRenew !== false;
          document.getElementById('startDate').value = subscription.startDate ? subscription.startDate.split('T')[0] : '';
          document.getElementById('expiryDate').value = subscription.expiryDate ? subscription.expiryDate.split('T')[0] : '';
          document.getElementById('periodValue').value = subscription.periodValue || 1;
          document.getElementById('periodUnit').value = subscription.periodUnit || 'month';
          document.getElementById('reminderDays').value = subscription.reminderDays !== undefined ? subscription.reminderDays : 7;
          
          clearFieldErrors();
          document.getElementById('subscriptionModal').classList.remove('hidden');
          setupModalEventListeners();
        }
      } catch (error) {
        console.error('获取订阅信息失败:', error);
        showToast('获取订阅信息失败', 'error');
      }
    }
    
    async function deleteSubscription(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      
      if (!confirm('确定要删除这个订阅吗？此操作不可恢复。')) {
        return;
      }
      
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>删除中...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/subscriptions/' + id, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showToast('删除成功', 'success');
          loadSubscriptions();
        } else {
          const error = await response.json();
          showToast('删除失败: ' + (error.message || '未知错误'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error('删除订阅失败:', error);
        showToast('删除失败，请稍后再试', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    window.addEventListener('load', loadSubscriptions);
  </script>
</body>
</html>
`;

const configPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>系统配置 - 订阅管理系统</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-secondary { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); transition: all 0.3s; }
    .btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
      color: white; font-weight: 500; z-index: 1000; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
    
    .config-section { 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 16px; 
      margin-bottom: 24px; 
    }
    .config-section.active { 
      background-color: #f8fafc; 
      border-color: #6366f1; 
    }
    .config-section.inactive { 
      background-color: #f9fafb; 
      opacity: 0.7; 
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">订阅管理系统</span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>订阅列表
          </a>
          <a href="/admin/config" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-cog mr-1"></i>系统配置
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登录
          </a>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">系统配置</h2>
      
      <form id="configForm" class="space-y-8">
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">管理员账户</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="adminUsername" class="block text-sm font-medium text-gray-700">用户名</label>
              <input type="text" id="adminUsername" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
            <div>
              <label for="adminPassword" class="block text-sm font-medium text-gray-700">密码</label>
              <input type="password" id="adminPassword" placeholder="如不修改密码，请留空" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">留空表示不修改当前密码</p>
            </div>
          </div>
        </div>
        
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">通知设置</h3>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">通知方式</label>
            <div class="flex space-x-6">
              <label class="inline-flex items-center">
                <input type="radio" name="notificationType" value="telegram" class="form-radio h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Telegram</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" name="notificationType" value="notifyx" class="form-radio h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked>
                <span class="ml-2 text-sm text-gray-700 font-semibold">NotifyX（推荐）</span>
              </label>
              <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> NotifyX官网
              </a>
            </div>
          </div>
          
          <div id="telegramConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Telegram 配置</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="tgBotToken" class="block text-sm font-medium text-gray-700">Bot Token</label>
                <input type="text" id="tgBotToken" placeholder="从 @BotFather 获取" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div>
                <label for="tgChatId" class="block text-sm font-medium text-gray-700">Chat ID</label>
                <input type="text" id="tgChatId" placeholder="可从 @userinfobot 获取" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testTelegramBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Telegram 通知
              </button>
            </div>
          </div>
          
          <div id="notifyxConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">NotifyX 配置</h4>
            <div class="mb-4">
              <label for="notifyxApiKey" class="block text-sm font-medium text-gray-700">API Key</label>
              <input type="text" id="notifyxApiKey" placeholder="从 NotifyX 平台获取的 API Key" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">从 <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800">NotifyX平台</a> 获取的 API Key</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testNotifyXBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 NotifyX 通知
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button type="submit" class="btn-primary text-white px-6 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-save mr-2"></i>保存配置
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }

    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        document.getElementById('adminUsername').value = config.ADMIN_USERNAME || '';
        document.getElementById('tgBotToken').value = config.TG_BOT_TOKEN || '';
        document.getElementById('tgChatId').value = config.TG_CHAT_ID || '';
        document.getElementById('notifyxApiKey').value = config.NOTIFYX_API_KEY || '';
        
        const notificationType = config.NOTIFICATION_TYPE || 'notifyx';
        document.querySelector('input[name="notificationType"][value="' + notificationType + '"]').checked = true;
        
        toggleNotificationConfig(notificationType);
      } catch (error) {
        console.error('加载配置失败:', error);
        showToast('加载配置失败，请刷新页面重试', 'error');
      }
    }
    
    function toggleNotificationConfig(type) {
      const telegramConfig = document.getElementById('telegramConfig');
      const notifyxConfig = document.getElementById('notifyxConfig');
      
      if (type === 'telegram') {
        telegramConfig.classList.remove('inactive');
        telegramConfig.classList.add('active');
        notifyxConfig.classList.remove('active');
        notifyxConfig.classList.add('inactive');
      } else if (type === 'notifyx') {
        telegramConfig.classList.remove('active');
        telegramConfig.classList.add('inactive');
        notifyxConfig.classList.remove('inactive');
        notifyxConfig.classList.add('active');
      }
    }
    
    document.querySelectorAll('input[name="notificationType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        toggleNotificationConfig(e.target.value);
      });
    });
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const config = {
        ADMIN_USERNAME: document.getElementById('adminUsername').value.trim(),
        TG_BOT_TOKEN: document.getElementById('tgBotToken').value.trim(),
        TG_CHAT_ID: document.getElementById('tgChatId').value.trim(),
        NOTIFYX_API_KEY: document.getElementById('notifyxApiKey').value.trim(),
        NOTIFICATION_TYPE: document.querySelector('input[name="notificationType"]:checked').value
      };
      
      const passwordField = document.getElementById('adminPassword');
      if (passwordField.value.trim()) {
        config.ADMIN_PASSWORD = passwordField.value.trim();
      }
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
      submitButton.disabled = true;
      
      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast('配置保存成功', 'success');
          passwordField.value = '';
        } else {
          showToast('配置保存失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('保存配置失败:', error);
        showToast('保存配置失败，请稍后再试', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
    async function testNotification(type) {
      const button = document.getElementById(type === 'telegram' ? 'testTelegramBtn' : 'testNotifyXBtn');
      const originalContent = button.innerHTML;
      const serviceName = type === 'telegram' ? 'Telegram' : 'NotifyX';
      
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>测试中...';
      button.disabled = true;
      
      const config = {};
      if (type === 'telegram') {
        config.TG_BOT_TOKEN = document.getElementById('tgBotToken').value.trim();
        config.TG_CHAT_ID = document.getElementById('tgChatId').value.trim();
        
        if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
          showToast('请先填写 Telegram Bot Token 和 Chat ID', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else {
        config.NOTIFYX_API_KEY = document.getElementById('notifyxApiKey').value.trim();
        
        if (!config.NOTIFYX_API_KEY) {
          showToast('请先填写 NotifyX API Key', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      }
      
      try {
        const response = await fetch('/api/test-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type, ...config })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast(serviceName + ' 通知测试成功！', 'success');
        } else {
          showToast(serviceName + ' 通知测试失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('测试通知失败:', error);
        showToast('测试失败，请稍后再试', 'error');
      } finally {
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('testTelegramBtn').addEventListener('click', () => {
      testNotification('telegram');
    });
    
    document.getElementById('testNotifyXBtn').addEventListener('click', () => {
      testNotification('notifyx');
    });
    
    window.addEventListener('load', loadConfig);
  </script>
</body>
</html>
`;

// 管理页面
const admin = {
  async handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    const config = await getConfig(env);
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    
    if (!user) {
      return new Response('', {
        status: 302,
        headers: { 'Location': '/' }
      });
    }
    
    if (pathname === '/admin/config') {
      return new Response(configPage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    return new Response(adminPage, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

// 处理API请求
const api = {
  async handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice(4);
    const method = request.method;
    
    const config = await getConfig(env);
    
    if (path === '/login' && method === 'POST') {
      const body = await request.json();
      
      if (body.username === config.ADMIN_USERNAME && body.password === config.ADMIN_PASSWORD) {
        const token = await generateJWT(body.username, config.JWT_SECRET);
        
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': 'token=' + token + '; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400'
            }
          }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, message: '用户名或密码错误' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (path === '/logout' && (method === 'GET' || method === 'POST')) {
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': 'token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
        }
      });
    }
    
    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    
    if (!user && path !== '/login') {
      return new Response(
        JSON.stringify({ success: false, message: '未授权访问' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (path === '/config') {
      if (method === 'GET') {
        const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
        return new Response(
          JSON.stringify(safeConfig),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (method === 'POST') {
        try {
          const newConfig = await request.json();
          
          const updatedConfig = { 
            ...config,
            ADMIN_USERNAME: newConfig.ADMIN_USERNAME || config.ADMIN_USERNAME,
            TG_BOT_TOKEN: newConfig.TG_BOT_TOKEN || '',
            TG_CHAT_ID: newConfig.TG_CHAT_ID || '',
            NOTIFYX_API_KEY: newConfig.NOTIFYX_API_KEY || '',
            NOTIFICATION_TYPE: newConfig.NOTIFICATION_TYPE || config.NOTIFICATION_TYPE
          };
          
          if (newConfig.ADMIN_PASSWORD) {
            updatedConfig.ADMIN_PASSWORD = newConfig.ADMIN_PASSWORD;
          }
          
          await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(updatedConfig));
          
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, message: '更新配置失败' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    if (path === '/test-notification' && method === 'POST') {
      try {
        const body = await request.json();
        let success = false;
        let message = '';
        
        if (body.type === 'telegram') {
          const testConfig = {
            ...config,
            TG_BOT_TOKEN: body.TG_BOT_TOKEN,
            TG_CHAT_ID: body.TG_CHAT_ID
          };
          
          const content = '*测试通知*\n\n这是一条测试通知，用于验证Telegram通知功能是否正常工作。\n\n发送时间: ' + new Date().toLocaleString();
          success = await sendTelegramNotification(content, testConfig);
          message = success ? 'Telegram通知发送成功' : 'Telegram通知发送失败，请检查配置';
        } else if (body.type === 'notifyx') {
          const testConfig = {
            ...config,
            NOTIFYX_API_KEY: body.NOTIFYX_API_KEY
          };
          
          const title = '测试通知';
          const content = '## 这是一条测试通知\n\n用于验证NotifyX通知功能是否正常工作。\n\n发送时间: ' + new Date().toLocaleString();
          const description = '测试NotifyX通知功能';
          
          success = await sendNotifyXNotification(title, content, description, testConfig);
          message = success ? 'NotifyX通知发送成功' : 'NotifyX通知发送失败，请检查配置';
        }
        
        return new Response(
          JSON.stringify({ success, message }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('测试通知失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: '测试通知失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (path === '/subscriptions') {
      if (method === 'GET') {
        const subscriptions = await getAllSubscriptions(env);
        return new Response(
          JSON.stringify(subscriptions),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (method === 'POST') {
        const subscription = await request.json();
        const result = await createSubscription(subscription, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 201 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    if (path.startsWith('/subscriptions/')) {
      const parts = path.split('/');
      const id = parts[2];
      
      if (parts[3] === 'toggle-status' && method === 'POST') {
        const body = await request.json();
        const result = await toggleSubscriptionStatus(id, body.isActive, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      if (parts[3] === 'test-notify' && method === 'POST') {
        const result = await testSingleSubscriptionNotification(id, env);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      if (method === 'GET') {
        const subscription = await getSubscription(id, env);
        
        return new Response(
          JSON.stringify(subscription),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (method === 'PUT') {
        const subscription = await request.json();
        const result = await updateSubscription(id, subscription, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (method === 'DELETE') {
        const result = await deleteSubscription(id, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, message: '未找到请求的资源' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// 工具函数
async function getConfig(env) {
  try {
    const data = await env.SUBSCRIPTIONS_KV.get('config');
    const config = data ? JSON.parse(data) : {};
    
    return {
      ADMIN_USERNAME: config.ADMIN_USERNAME || 'admin',
      ADMIN_PASSWORD: config.ADMIN_PASSWORD || 'password',
      JWT_SECRET: config.JWT_SECRET || 'your-secret-key',
      TG_BOT_TOKEN: config.TG_BOT_TOKEN || '',
      TG_CHAT_ID: config.TG_CHAT_ID || '',
      NOTIFYX_API_KEY: config.NOTIFYX_API_KEY || '',
      NOTIFICATION_TYPE: config.NOTIFICATION_TYPE || 'notifyx'
    };
  } catch (error) {
    return {
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'password',
      JWT_SECRET: 'your-secret-key',
      TG_BOT_TOKEN: '',
      TG_CHAT_ID: '',
      NOTIFYX_API_KEY: '',
      NOTIFICATION_TYPE: 'notifyx'
    };
  }
}

async function generateJWT(username, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { username, iat: Math.floor(Date.now() / 1000) };
  
  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));
  
  const signatureInput = headerBase64 + '.' + payloadBase64;
  const signature = await CryptoJS.HmacSHA256(signatureInput, secret);
  
  return headerBase64 + '.' + payloadBase64 + '.' + signature;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerBase64, payloadBase64, signature] = parts;
    const signatureInput = headerBase64 + '.' + payloadBase64;
    const expectedSignature = await CryptoJS.HmacSHA256(signatureInput, secret);
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(atob(payloadBase64));
    return payload;
  } catch (error) {
    return null;
  }
}

async function getAllSubscriptions(env) {
  try {
    const data = await env.SUBSCRIPTIONS_KV.get('subscriptions');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

async function getSubscription(id, env) {
  const subscriptions = await getAllSubscriptions(env);
  return subscriptions.find(s => s.id === id);
}

async function createSubscription(subscription, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: '缺少必填字段' };
    }
    
    let expiryDate = new Date(subscription.expiryDate);
    const now = new Date();
    
    if (expiryDate < now && subscription.periodValue && subscription.periodUnit) {
      while (expiryDate < now) {
        if (subscription.periodUnit === 'day') {
          expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
          expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
          expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
        }
      }
      subscription.expiryDate = expiryDate.toISOString();
    }
    
    const newSubscription = {
      id: Date.now().toString(),
      name: subscription.name,
      customType: subscription.customType || '',
      startDate: subscription.startDate || null,
      expiryDate: subscription.expiryDate,
      periodValue: subscription.periodValue || 1,
      periodUnit: subscription.periodUnit || 'month',
      reminderDays: subscription.reminderDays !== undefined ? subscription.reminderDays : 7,
      notes: subscription.notes || '',
      isActive: subscription.isActive !== false,
      autoRenew: subscription.autoRenew !== false,
      createdAt: new Date().toISOString()
    };
    
    subscriptions.push(newSubscription);
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { success: true, subscription: newSubscription };
  } catch (error) {
    return { success: false, message: '创建订阅失败' };
  }
}

async function updateSubscription(id, subscription, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex(s => s.id === id);
    
    if (index === -1) {
      return { success: false, message: '订阅不存在' };
    }
    
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: '缺少必填字段' };
    }
    
    let expiryDate = new Date(subscription.expiryDate);
    const now = new Date();
    
    if (expiryDate < now && subscription.periodValue && subscription.periodUnit) {
      while (expiryDate < now) {
        if (subscription.periodUnit === 'day') {
          expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
          expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
          expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
        }
      }
      subscription.expiryDate = expiryDate.toISOString();
    }
    
    subscriptions[index] = {
      ...subscriptions[index],
      name: subscription.name,
      customType: subscription.customType || subscriptions[index].customType || '',
      startDate: subscription.startDate || subscriptions[index].startDate,
      expiryDate: subscription.expiryDate,
      periodValue: subscription.periodValue || subscriptions[index].periodValue || 1,
      periodUnit: subscription.periodUnit || subscriptions[index].periodUnit || 'month',
      reminderDays: subscription.reminderDays !== undefined ? subscription.reminderDays : (subscriptions[index].reminderDays !== undefined ? subscriptions[index].reminderDays : 7),
      notes: subscription.notes || '',
      isActive: subscription.isActive !== undefined ? subscription.isActive : subscriptions[index].isActive,
      autoRenew: subscription.autoRenew !== undefined ? subscription.autoRenew : (subscriptions[index].autoRenew !== undefined ? subscriptions[index].autoRenew : true),
      updatedAt: new Date().toISOString()
    };
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { success: true, subscription: subscriptions[index] };
  } catch (error) {
    return { success: false, message: '更新订阅失败' };
  }
}

async function deleteSubscription(id, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const filteredSubscriptions = subscriptions.filter(s => s.id !== id);
    
    if (filteredSubscriptions.length === subscriptions.length) {
      return { success: false, message: '订阅不存在' };
    }
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(filteredSubscriptions));
    
    return { success: true };
  } catch (error) {
    return { success: false, message: '删除订阅失败' };
  }
}

async function toggleSubscriptionStatus(id, isActive, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex(s => s.id === id);
    
    if (index === -1) {
      return { success: false, message: '订阅不存在' };
    }
    
    subscriptions[index] = {
      ...subscriptions[index],
      isActive: isActive,
      updatedAt: new Date().toISOString()
    };
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { success: true, subscription: subscriptions[index] };
  } catch (error) {
    return { success: false, message: '更新订阅状态失败' };
  }
}

async function testSingleSubscriptionNotification(id, env) {
  try {
    const subscription = await getSubscription(id, env);
    if (!subscription) {
      return { success: false, message: '未找到该订阅' };
    }
    const config = await getConfig(env);

    const title = `手动测试通知: ${subscription.name}`;
    const description = `这是一个对订阅 "${subscription.name}" 的手动测试通知。`;
    let content = '';

    // 根据所选通知渠道格式化消息内容，与主提醒功能保持一致
    if (config.NOTIFICATION_TYPE === 'notifyx') {
        content = `## ${title}\n\n**订阅详情**:\n- **类型**: ${subscription.customType || '其他'}\n- **到期日**: ${new Date(subscription.expiryDate).toLocaleDateString()}\n- **备注**: ${subscription.notes || '无'}`;
    } else { // 默认 Telegram
        content = `*${title}*\n\n**订阅详情**:\n- **类型**: ${subscription.customType || '其他'}\n- **到期日**: ${new Date(subscription.expiryDate).toLocaleDateString()}\n- **备注**: ${subscription.notes || '无'}`;
    }

    const success = await sendNotification(title, content, description, config);

    if (success) {
        return { success: true, message: '测试通知已成功发送' };
    } else {
        return { success: false, message: '测试通知发送失败，请检查配置' };
    }

  } catch (error) {
    console.error('[手动测试] 发送失败:', error);
    return { success: false, message: '发送时发生错误: ' + error.message };
  }
}

async function sendWeComNotification(message, config) {
    // This is a placeholder. In a real scenario, you would implement the WeCom notification logic here.
    console.log("[企业微信] 通知功能未实现");
    return { success: false, message: "企业微信通知功能未实现" };
}

async function sendNotificationToAllChannels(title, commonContent, config, logPrefix = '[定时任务]') {
    if (!config.ENABLED_NOTIFIERS || config.ENABLED_NOTIFIERS.length === 0) {
        console.log(`${logPrefix} 未启用任何通知渠道。`);
        return;
    }

    if (config.ENABLED_NOTIFIERS.includes('notifyx')) {
        const notifyxContent = `## ${title}\n\n${commonContent}`;
        const success = await sendNotifyXNotification(title, notifyxContent, `订阅提醒`, config);
        console.log(`${logPrefix} 发送NotifyX通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('telegram')) {
        const telegramContent = `*${title}*\n\n${commonContent.replace(/(\s)/g, ' ')}`;
        const success = await sendTelegramNotification(telegramContent, config);
        console.log(`${logPrefix} 发送Telegram通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('weixin')) {
        const weixinContent = `【${title}】\n\n${commonContent.replace(/(\**|\*|##|#|`)/g, '')}`;
        const result = await sendWeComNotification(weixinContent, config);
        console.log(`${logPrefix} 发送企业微信通知 ${result.success ? '成功' : '失败'}. ${result.message}`);
    }
}

async function sendTelegramNotification(message, config) {
  try {
    if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
      console.error('[Telegram] 通知未配置，缺少Bot Token或Chat ID');
      return false;
    }
    
    console.log('[Telegram] 开始发送通知到 Chat ID: ' + config.TG_CHAT_ID);
    
    const url = 'https://api.telegram.org/bot' + config.TG_BOT_TOKEN + '/sendMessage';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.TG_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    console.log('[Telegram] 发送结果:', result);
    return result.ok;
  } catch (error) {
    console.error('[Telegram] 发送通知失败:', error);
    return false;
  }
}

async function sendNotifyXNotification(title, content, description, config) {
  try {
    if (!config.NOTIFYX_API_KEY) {
      console.error('[NotifyX] 通知未配置，缺少API Key');
      return false;
    }
    
    console.log('[NotifyX] 开始发送通知: ' + title);
    
    const url = 'https://www.notifyx.cn/api/v1/send/' + config.NOTIFYX_API_KEY;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        content: content,
        description: description || ''
      })
    });
    
    const result = await response.json();
    console.log('[NotifyX] 发送结果:', result);
    return result.status === 'queued';
  } catch (error) {
    console.error('[NotifyX] 发送通知失败:', error);
    return false;
  }
}

async function sendNotification(title, content, description, config) {
  if (config.NOTIFICATION_TYPE === 'notifyx') {
    return await sendNotifyXNotification(title, content, description, config);
  } else {
    return await sendTelegramNotification(content, config);
  }
}

// 定时检查即将到期的订阅 - 完全优化版
async function checkExpiringSubscriptions(env) {
  try {
    console.log('[定时任务] 开始检查即将到期的订阅: ' + new Date().toISOString());
    
    const subscriptions = await getAllSubscriptions(env);
    console.log('[定时任务] 共找到 ' + subscriptions.length + ' 个订阅');
    
    const config = await getConfig(env);
    const now = new Date();
    const expiringSubscriptions = [];
    const updatedSubscriptions = [];
    let hasUpdates = false;
    
    for (const subscription of subscriptions) {
      if (subscription.isActive === false) {
        console.log('[定时任务] 订阅 "' + subscription.name + '" 已停用，跳过');
        continue;
      }
      
      const expiryDate = new Date(subscription.expiryDate);
      const daysDiff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      console.log('[定时任务] 订阅 "' + subscription.name + '" 到期日期: ' + expiryDate.toISOString() + ', 剩余天数: ' + daysDiff);
      
      // 修复提前提醒天数逻辑
      const reminderDays = subscription.reminderDays !== undefined ? subscription.reminderDays : 7;
      let shouldRemind = false;
      
      if (reminderDays === 0) {
        // 当提前提醒天数为0时，只在到期日当天提醒
        shouldRemind = daysDiff === 0;
      } else {
        // 当提前提醒天数大于0时，在指定范围内提醒
        shouldRemind = daysDiff >= 0 && daysDiff <= reminderDays;
      }
      
      // 如果已过期，且设置了周期和自动续订，则自动更新到下一个周期
      if (daysDiff < 0 && subscription.periodValue && subscription.periodUnit && subscription.autoRenew !== false) {
        console.log('[定时任务] 订阅 "' + subscription.name + '" 已过期且启用自动续订，正在更新到下一个周期');
        
        const newExpiryDate = new Date(expiryDate);
        
        if (subscription.periodUnit === 'day') {
          newExpiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
          newExpiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
          newExpiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
        }
        
        while (newExpiryDate < now) {
          console.log('[定时任务] 新计算的到期日期 ' + newExpiryDate.toISOString() + ' 仍然过期，继续计算下一个周期');
          
          if (subscription.periodUnit === 'day') {
            newExpiryDate.setDate(newExpiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === 'month') {
            newExpiryDate.setMonth(newExpiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === 'year') {
            newExpiryDate.setFullYear(newExpiryDate.getFullYear() + subscription.periodValue);
          }
        }
        
        console.log('[定时任务] 订阅 "' + subscription.name + '" 更新到期日期: ' + newExpiryDate.toISOString());
        
        const updatedSubscription = { ...subscription, expiryDate: newExpiryDate.toISOString() };
        updatedSubscriptions.push(updatedSubscription);
        hasUpdates = true;
        
        const newDaysDiff = Math.ceil((newExpiryDate - now) / (1000 * 60 * 60 * 24));
        
        let shouldRemindAfterRenewal = false;
        if (reminderDays === 0) {
          shouldRemindAfterRenewal = newDaysDiff === 0;
        } else {
          shouldRemindAfterRenewal = newDaysDiff >= 0 && newDaysDiff <= reminderDays;
        }
        
        if (shouldRemindAfterRenewal) {
          console.log('[定时任务] 订阅 "' + subscription.name + '" 在提醒范围内，将发送通知');
          expiringSubscriptions.push({
            ...updatedSubscription,
            daysRemaining: newDaysDiff
          });
        }
      } else if (daysDiff < 0 && subscription.autoRenew === false) {
        console.log('[定时任务] 订阅 "' + subscription.name + '" 已过期且未启用自动续订，将发送过期通知');
        expiringSubscriptions.push({
          ...subscription,
          daysRemaining: daysDiff
        });
      } else if (shouldRemind) {
        console.log('[定时任务] 订阅 "' + subscription.name + '" 在提醒范围内，将发送通知');
        expiringSubscriptions.push({
          ...subscription,
          daysRemaining: daysDiff
        });
      }
    }
    
    if (hasUpdates) {
      console.log('[定时任务] 有 ' + updatedSubscriptions.length + ' 个订阅需要更新到下一个周期');
      
      const mergedSubscriptions = subscriptions.map(sub => {
        const updated = updatedSubscriptions.find(u => u.id === sub.id);
        return updated || sub;
      });
      
      await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(mergedSubscriptions));
      console.log('[定时任务] 已更新订阅列表');
    }
    
    if (expiringSubscriptions.length > 0) {
      console.log('[定时任务] 有 ' + expiringSubscriptions.length + ' 个订阅需要发送通知');
      
      let commonContent = '';
      expiringSubscriptions.sort((a, b) => a.daysRemaining - b.daysRemaining);

      for (const sub of expiringSubscriptions) {
        const typeText = sub.customType || '其他';
        const periodText = (sub.periodValue && sub.periodUnit) ? `(周期: ${sub.periodValue} ${ { day: '天', month: '月', year: '年' }[sub.periodUnit] || sub.periodUnit})` : '';
        
        let statusText;
        if (sub.daysRemaining === 0) statusText = `⚠️ **${sub.name}** (${typeText}) ${periodText} 今天到期！`;
        else if (sub.daysRemaining < 0) statusText = `🚨 **${sub.name}** (${typeText}) ${periodText} 已过期 ${Math.abs(sub.daysRemaining)} 天`;
        else statusText = `📅 **${sub.name}** (${typeText}) ${periodText} 将在 ${sub.daysRemaining} 天后到期`;

        if (sub.notes) statusText += `\n   备注: ${sub.notes}`;
        commonContent += statusText + '\n\n';
      }
      
      await sendNotificationToAllChannels(title, commonContent, config, logPrefix);

    } else {
      console.log('[定时任务] 没有需要提醒的订阅');
    }
    
    console.log('[定时任务] 检查完成');
  } catch (error) {
    console.error('[定时任务] 检查即将到期的订阅失败:', error);
  }
}

function getCookieValue(cookieString, key) {
  if (!cookieString) return null;
  
  const match = cookieString.match(new RegExp('(^| )' + key + '=([^;]+)'));
  return match ? match[2] : null;
}

async function handleRequest(request, env, ctx) {
  return new Response(loginPage, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

const CryptoJS = {
  HmacSHA256: function(message, key) {
    const keyData = new TextEncoder().encode(key);
    const messageData = new TextEncoder().encode(message);
    
    return Promise.resolve().then(() => {
      return crypto.subtle.importKey(
        "raw", 
        keyData,
        { name: "HMAC", hash: {name: "SHA-256"} },
        false,
        ["sign"]
      );
    }).then(cryptoKey => {
      return crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData
      );
    }).then(buffer => {
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api')) {
      return api.handleRequest(request, env, ctx);
    } else if (url.pathname.startsWith('/admin')) {
      return admin.handleRequest(request, env, ctx);
    } else {
      return handleRequest(request, env, ctx);
    }
  },
  
  async scheduled(event, env, ctx) {
    console.log('[Workers] 定时任务触发时间:', new Date().toISOString());
    await checkExpiringSubscriptions(env);
  }
};
