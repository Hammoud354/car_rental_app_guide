import re

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

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all <Input ... /> or <Input ...> ... </Input> patterns
    # Add className="input-client" if it doesn't have className
    def add_class(match):
        tag = match.group(0)
        # Skip if already has className
        if 'className=' in tag:
            # If has className but not input-client, append it
            if 'input-client' not in tag:
                tag = tag.replace('className="', 'className="input-client ')
        else:
            # Add className before /> or >
            if tag.endswith('/>'):
                tag = tag[:-2] + ' className="input-client" />'
            else:
                tag = tag[:-1] + ' className="input-client">'
        return tag
    
    # Match <Input with any attributes until /> or >
    content = re.sub(r'<Input[^>]*/?>', add_class, content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✓ Processed {filepath}")

print("\n✓ All files processed")
