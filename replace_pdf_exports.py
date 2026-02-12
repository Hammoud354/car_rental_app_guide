import re

# Read RentalContracts.tsx
with open("client/src/pages/RentalContracts.tsx", "r") as f:
    content = f.read()

# Pattern to match the PDF export code blocks (starting from "Get all elements" comment)
# We'll replace from the comment to the pdf.save() line

# First occurrence (Export to PDF button)
pattern1 = r'// Get all elements and their computed styles BEFORE cloning.*?pdf\.save\(`contract-\$\{selectedContract\.id\}\.pdf`\);'

replacement1 = '''// Use the universal PDF export utility
                      await exportToPDF(
                        "contract-details-content",
                        `contract-${selectedContract.id}`,
                        { scale: 2, orientation: "portrait", format: "a4" }
                      );'''

content = re.sub(pattern1, replacement1, content, flags=re.DOTALL, count=1)

# Second occurrence (Share via WhatsApp button)
pattern2 = r'// Get all elements and their computed styles BEFORE cloning.*?const imgData = canvas\.toDataURL\(\'image/png\'\);'

replacement2 = '''// Use the universal PDF export utility to get PNG
                      const imgData = await exportToPNG(
                        "contract-details-content",
                        `contract-${selectedContract.id}`,
                        { scale: 2 }
                      );'''

content = re.sub(pattern2, replacement2, content, flags=re.DOTALL, count=1)

# Write back
with open("client/src/pages/RentalContracts.tsx", "w") as f:
    f.write(content)

print("✅ RentalContracts.tsx updated")
