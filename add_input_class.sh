#!/bin/bash

# List of files to process (excluding Clients.tsx which already has the class)
files=(
  "client/src/pages/CompanySettings.tsx"
  "client/src/pages/FleetManagement.tsx"
  "client/src/pages/ForgotPassword.tsx"
  "client/src/pages/Maintenance.tsx"
  "client/src/pages/Register.tsx"
  "client/src/pages/RentalContracts.tsx"
  "client/src/pages/ResetPassword.tsx"
  "client/src/pages/Settings.tsx"
  "client/src/pages/SignIn.tsx"
  "client/src/pages/SignUp.tsx"
  "client/src/pages/MaintenanceTracking.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Add input-client class to Input components that don't have className
    sed -i 's/<Input \([^>]*\)>/<Input \1 className="input-client">/g' "$file"
    # Add input-client to existing className attributes
    sed -i 's/className="\([^"]*\)"/className="\1 input-client"/g' "$file"
    # Remove duplicate input-client classes
    sed -i 's/input-client input-client/input-client/g' "$file"
  fi
done

echo "Done!"
