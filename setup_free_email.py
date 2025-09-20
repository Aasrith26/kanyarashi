#!/usr/bin/env python3
"""
Free Email Setup Script
Helps users configure free email providers for the feedback system
"""

import os
import sys
from dotenv import load_dotenv

def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("📧 FREE EMAIL SETUP FOR FEEDBACK SYSTEM")
    print("=" * 60)
    print("This script will help you configure a FREE email provider")
    print("for sending feedback emails to candidates.")
    print()

def get_email_provider():
    """Get user's email provider choice"""
    print("Available FREE email providers:")
    print("1. Gmail (Recommended - 500 emails/day)")
    print("2. Outlook/Hotmail (300 emails/day)")
    print("3. Yahoo (500 emails/day)")
    print("4. Custom SMTP")
    print()
    
    while True:
        choice = input("Choose your email provider (1-4): ").strip()
        if choice == "1":
            return "gmail"
        elif choice == "2":
            return "outlook"
        elif choice == "3":
            return "yahoo"
        elif choice == "4":
            return "custom_smtp"
        else:
            print("❌ Invalid choice. Please enter 1, 2, 3, or 4.")

def get_gmail_config():
    """Get Gmail configuration"""
    print("\n📧 Gmail Configuration")
    print("=" * 30)
    print("To use Gmail, you need to:")
    print("1. Enable 2-Factor Authentication")
    print("2. Generate an App Password")
    print()
    print("Steps:")
    print("1. Go to: https://myaccount.google.com/security")
    print("2. Enable 2-Step Verification")
    print("3. Go to: https://myaccount.google.com/apppasswords")
    print("4. Generate an App Password for 'Mail'")
    print("5. Copy the 16-character password")
    print()
    
    email = input("Enter your Gmail address: ").strip()
    app_password = input("Enter your 16-character App Password: ").strip()
    
    return {
        "EMAIL_PROVIDER": "gmail",
        "SMTP_USERNAME": email,
        "SMTP_PASSWORD": app_password,
        "FROM_EMAIL": email,
        "REPLY_TO_EMAIL": email
    }

def get_outlook_config():
    """Get Outlook configuration"""
    print("\n📧 Outlook Configuration")
    print("=" * 30)
    print("To use Outlook, you need to:")
    print("1. Create a free Outlook account")
    print("2. Enable 'Less secure app access' (temporarily)")
    print()
    print("Steps:")
    print("1. Go to: https://outlook.com")
    print("2. Create a free account")
    print("3. Go to: https://account.microsoft.com/security")
    print("4. Enable 'Less secure app access'")
    print()
    
    email = input("Enter your Outlook email: ").strip()
    password = input("Enter your Outlook password: ").strip()
    
    return {
        "EMAIL_PROVIDER": "outlook",
        "SMTP_USERNAME": email,
        "SMTP_PASSWORD": password,
        "FROM_EMAIL": email,
        "REPLY_TO_EMAIL": email
    }

def get_yahoo_config():
    """Get Yahoo configuration"""
    print("\n📧 Yahoo Configuration")
    print("=" * 30)
    print("To use Yahoo, you need to:")
    print("1. Enable 2-Factor Authentication")
    print("2. Generate an App Password")
    print()
    print("Steps:")
    print("1. Go to: https://login.yahoo.com/account/security")
    print("2. Enable 2-Step Verification")
    print("3. Generate App Password for 'Mail'")
    print("4. Copy the App Password")
    print()
    
    email = input("Enter your Yahoo email: ").strip()
    app_password = input("Enter your App Password: ").strip()
    
    return {
        "EMAIL_PROVIDER": "yahoo",
        "SMTP_USERNAME": email,
        "SMTP_PASSWORD": app_password,
        "FROM_EMAIL": email,
        "REPLY_TO_EMAIL": email
    }

def get_custom_smtp_config():
    """Get custom SMTP configuration"""
    print("\n📧 Custom SMTP Configuration")
    print("=" * 30)
    
    server = input("Enter SMTP server (e.g., smtp.example.com): ").strip()
    port = input("Enter SMTP port (default: 587): ").strip() or "587"
    username = input("Enter SMTP username: ").strip()
    password = input("Enter SMTP password: ").strip()
    from_email = input("Enter from email address: ").strip()
    
    return {
        "EMAIL_PROVIDER": "custom_smtp",
        "SMTP_SERVER": server,
        "SMTP_PORT": port,
        "SMTP_USERNAME": username,
        "SMTP_PASSWORD": password,
        "FROM_EMAIL": from_email,
        "REPLY_TO_EMAIL": from_email
    }

def update_env_file(config):
    """Update .env file with email configuration"""
    env_file = ".env"
    
    # Load existing .env file
    existing_config = {}
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    existing_config[key] = value
    
    # Update with new email configuration
    existing_config.update(config)
    
    # Add default values
    defaults = {
        "FROM_NAME": "Innomatics Research Lab",
        "USE_TLS": "true",
        "USE_SSL": "false"
    }
    
    for key, value in defaults.items():
        if key not in existing_config:
            existing_config[key] = value
    
    # Write updated .env file
    with open(env_file, 'w') as f:
        f.write("# Email Configuration (Generated by setup script)\n")
        f.write(f"EMAIL_PROVIDER={existing_config['EMAIL_PROVIDER']}\n")
        f.write(f"SMTP_USERNAME={existing_config['SMTP_USERNAME']}\n")
        f.write(f"SMTP_PASSWORD={existing_config['SMTP_PASSWORD']}\n")
        f.write(f"FROM_EMAIL={existing_config['FROM_EMAIL']}\n")
        f.write(f"FROM_NAME={existing_config['FROM_NAME']}\n")
        f.write(f"REPLY_TO_EMAIL={existing_config['REPLY_TO_EMAIL']}\n")
        f.write(f"USE_TLS={existing_config['USE_TLS']}\n")
        f.write(f"USE_SSL={existing_config['USE_SSL']}\n")
        
        if 'SMTP_SERVER' in existing_config:
            f.write(f"SMTP_SERVER={existing_config['SMTP_SERVER']}\n")
        if 'SMTP_PORT' in existing_config:
            f.write(f"SMTP_PORT={existing_config['SMTP_PORT']}\n")
        
        f.write("\n")
        
        # Write other existing configurations
        for key, value in existing_config.items():
            if key not in ['EMAIL_PROVIDER', 'SMTP_USERNAME', 'SMTP_PASSWORD', 
                          'FROM_EMAIL', 'FROM_NAME', 'REPLY_TO_EMAIL', 
                          'USE_TLS', 'USE_SSL', 'SMTP_SERVER', 'SMTP_PORT']:
                f.write(f"{key}={value}\n")

def test_configuration():
    """Test the email configuration"""
    print("\n🧪 Testing Email Configuration")
    print("=" * 30)
    
    try:
        from email_service import get_email_service
        
        email_service = get_email_service()
        print("✅ Email service initialized successfully")
        print(f"✅ Provider: {email_service.config.provider}")
        print(f"✅ From: {email_service.config.from_email}")
        
        return True
        
    except ImportError:
        print("❌ Email service not available. Make sure you're in the correct directory.")
        return False
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def main():
    """Main setup function"""
    print_banner()
    
    # Check if we're in the right directory
    if not os.path.exists("email_service.py"):
        print("❌ Error: email_service.py not found.")
        print("Please run this script from the JD-ResAIAgent directory.")
        sys.exit(1)
    
    # Get email provider choice
    provider = get_email_provider()
    
    # Get configuration based on provider
    if provider == "gmail":
        config = get_gmail_config()
    elif provider == "outlook":
        config = get_outlook_config()
    elif provider == "yahoo":
        config = get_yahoo_config()
    elif provider == "custom_smtp":
        config = get_custom_smtp_config()
    
    # Update .env file
    print(f"\n💾 Updating .env file...")
    update_env_file(config)
    print("✅ .env file updated successfully")
    
    # Test configuration
    if test_configuration():
        print("\n🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Run: python test_feedback_system.py")
        print("2. Test sending a feedback email")
        print("3. Check the FREE_EMAIL_SETUP_GUIDE.md for troubleshooting")
    else:
        print("\n⚠️  Setup completed but configuration test failed.")
        print("Please check your credentials and try again.")
        print("See FREE_EMAIL_SETUP_GUIDE.md for troubleshooting help.")

if __name__ == "__main__":
    main()
