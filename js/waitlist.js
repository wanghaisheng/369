document.addEventListener('DOMContentLoaded', function() {
    const waitlistForm = document.getElementById('waitlist-form');
    
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const experience = document.getElementById('experience').value;
            const privacyConsent = document.getElementById('privacy-consent').checked;
            
            // 获取选中的兴趣领域
            const interests = [];
            document.querySelectorAll('input[name="interests"]:checked').forEach(checkbox => {
                interests.push(checkbox.value);
            });
            
            // 验证表单
            if (!name || !email) {
                alert('请填写必填字段');
                return;
            }
            
            if (!privacyConsent) {
                alert('请同意隐私条款');
                return;
            }
            
            // 这里可以添加表单提交逻辑
            console.log('表单提交:', { name, email, phone, interests, experience });
            
            // 模拟提交成功
            alert('感谢您的加入！我们将在应用准备就绪时通知您。');
            waitlistForm.reset();
        });
    }
});