import re
import sys

with open(r'c:\Users\WILLIAM DSK\Desktop\Nouveau dossier\facebook-auto-bot-main\src\app\dashboard\settings\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Colors
content = content.replace('indigo-', 'rose-')
content = content.replace('purple-', 'orange-')
content = content.replace('blue-500', 'rose-500')
content = content.replace('blue-400', 'rose-400')

# 2. Layout Widths & Gaps
content = content.replace('lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8', 'lg:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-12')
content = content.replace('lg:w-[220px]', 'lg:w-[240px]')
content = content.replace('max-w-2xl', 'max-w-3xl')

# 3. Premium Card styling
# Add subtle depth to all bg-surface / cards
content = content.replace('bg-surface ', 'bg-surface shadow-sm ')
# Some borders can be softer
content = content.replace('border-border/80', 'border-border/50')
content = content.replace('border border-border bg-surface-2', 'border border-border/50 bg-surface-2/60 backdrop-blur-sm')

# 4. Premium Inputs
content = content.replace('focus:ring-indigo-500/20', 'focus:ring-rose-500/25')
content = content.replace('border-border bg-surface', 'border-border/60 bg-surface shadow-sm')
content = content.replace('px-3.5 py-2.5', 'px-4 py-3') # larger inputs for better UX
content = content.replace('text-xs text-foreground', 'text-sm text-foreground') # Slightly bigger text for inputs for readability
content = content.replace('text-xs', 'text-sm') # Make text-xs to text-sm globally for better readability, but revert some specific ones if needed.
# Actually, global replace of text-xs to text-sm might break layout. Let's do it carefully.
content = content.replace('text-xs text-foreground outline-none', 'text-sm text-foreground outline-none transition-all')

# 5. Buttons
content = content.replace('bg-rose-600 hover:bg-rose-500', 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all')

# 6. Sidebar active state
content = content.replace('bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold shadow-sm border border-rose-500/20', 'bg-gradient-to-r from-rose-500/15 to-transparent text-rose-600 dark:text-rose-400 font-bold border-l-2 border-rose-500 rounded-r-xl rounded-l-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]')
content = content.replace('text-muted-foreground hover:bg-surface-2', 'text-muted-foreground hover:bg-surface-2/50')

# 7. Add smooth enter animation
content = content.replace('animate-in fade-in duration-200', 'animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out')

with open(r'c:\Users\WILLIAM DSK\Desktop\Nouveau dossier\facebook-auto-bot-main\src\app\dashboard\settings\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File upgraded successfully.')
