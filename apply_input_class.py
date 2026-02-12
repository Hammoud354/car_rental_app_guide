import re
import sys

def add_input_class(file_path):
    """Add input-client class to all Input components in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: Input tags with existing className - append input-client
        # Match: className="..." where input-client is not already present
        def append_to_classname(match):
            classname = match.group(1)
            if 'input-client' not in classname:
                return f'className="{classname} input-client"'
            return match.group(0)
        
        content = re.sub(r'className="([^"]*)"(?![^<]*input-client)', append_to_classname, content)
        
        # Pattern 2: Input tags without className - add it before closing />
        # Only match Input components (not InputOTP or other Input* components)
        content = re.sub(
            r'(<Input\s+[^>]*?)(\s*/>)',
            lambda m: m.group(1) + ' className="input-client"' + m.group(2) if 'className=' not in m.group(1) else m.group(0),
            content
        )
        
        # Clean up: remove duplicate input-client classes
        content = re.sub(r'input-client\s+input-client', 'input-client', content)
        content = re.sub(r'input-client input-client', 'input-client', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated: {file_path}")
            return True
        else:
            print(f"○ No changes: {file_path}")
            return False
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False

# Files to process
files = [
    "client/src/pages/Settings.tsx",
    "client/src/pages/CompanySettings.tsx",
    "client/src/pages/Maintenance.tsx",
    "client/src/pages/MaintenanceTracking.tsx",
    "client/src/pages/SignIn.tsx",
    "client/src/pages/SignUp.tsx",
    "client/src/pages/ForgotPassword.tsx",
    "client/src/pages/ResetPassword.tsx",
    "client/src/pages/Register.tsx",
]

updated_count = 0
for file_path in files:
    if add_input_class(file_path):
        updated_count += 1

print(f"\n✓ Updated {updated_count}/{len(files)} files")
