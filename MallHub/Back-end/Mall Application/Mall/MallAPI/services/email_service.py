from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from MallAPI.models.user_model import User
from django.template.loader import render_to_string
from django.utils.html import strip_tags

class EmailService:
    @staticmethod
    def get_all_customer_emails():
        """Get a list of all customer email addresses"""
        return User.objects.filter(role='CUSTOMER', is_active=True).values_list('email', flat=True)
    
    @staticmethod
    def send_admin_discount_notification(discount_code, discount_value):
        """
        Send notification to all customers when admin creates a discount code
        """
        subject = "Special Discount from MallHub!"
        
        # Create HTML content
        html_message = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #3B82F6; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f8f9fa; }}
                    .discount-code {{ font-size: 24px; font-weight: bold; padding: 10px; background-color: #e9ecef; 
                                     border: 1px dashed #6c757d; text-align: center; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Special Discount!</h1>
                    </div>
                    <div class="content">
                        <h2>The Mall has a special Discount for you!!</h2>
                        <p>Use the code below for a {discount_value}% discount on your order:</p>
                        <div class="discount-code">{discount_code}</div>
                        <p>Visit MallHub now to enjoy these amazing savings!</p>
                    </div>
                    <div class="footer">
                        &copy; MallHub. All rights reserved.
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        from_email = settings.EMAIL_HOST_USER
        recipient_list = EmailService.get_all_customer_emails()
        
        if not recipient_list:
            return False, "No active customers found"
        
        try:
            for recipient in recipient_list:
                # Send individual emails to each customer to avoid exposing all email addresses
                mail = EmailMultiAlternatives(
                    subject, 
                    plain_message, 
                    from_email, 
                    [recipient]
                )
                mail.attach_alternative(html_message, "text/html")
                mail.send(fail_silently=False)
            
            return True, f"Notification sent to {len(recipient_list)} customers"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def send_store_discount_notification(store_name, discount_value):
        """
        Send notification to all customers when a store manager applies a discount
        """
        subject = f"New Discount at {store_name}!"
        
        # Create HTML content
        html_message = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #E53E3E; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f8f9fa; }}
                    .discount-value {{ font-size: 24px; font-weight: bold; color: #E53E3E; }}
                    .store-name {{ font-weight: bold; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Store Discount Alert!</h1>
                    </div>
                    <div class="content">
                        <h2><span class="store-name">{store_name}</span> has a new discount!</h2>
                        <p>Don't miss out on <span class="discount-value">{discount_value}%</span> off all products!</p>
                        <p>Visit the store now to enjoy these savings!</p>
                    </div>
                    <div class="footer">
                        &copy; MallHub. All rights reserved.
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        from_email = settings.EMAIL_HOST_USER
        recipient_list = EmailService.get_all_customer_emails()
        
        if not recipient_list:
            return False, "No active customers found"
        
        try:
            for recipient in recipient_list:
                # Send individual emails to each customer to avoid exposing all email addresses
                mail = EmailMultiAlternatives(
                    subject, 
                    plain_message, 
                    from_email, 
                    [recipient]
                )
                mail.attach_alternative(html_message, "text/html")
                mail.send(fail_silently=False)
                
            return True, f"Notification sent to {len(recipient_list)} customers"
        except Exception as e:
            return False, str(e) 