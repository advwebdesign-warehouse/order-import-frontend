//file path: app/dashboard/shared/utils/colorUtils.ts

export interface StatusColors {
  bg: string
  text: string
}

const TAILWIND_COLOR_MAP: Record<string, string> = {
  // Gray
  'bg-gray-100': '#f3f4f6',
  'bg-gray-600': '#4b5563',
  'text-gray-800': '#1f2937',
  'text-gray-600': '#4b5563',

  // Red
  'bg-red-100': '#fee2e2',
  'bg-red-600': '#dc2626',
  'text-red-800': '#991b1b',
  'text-red-600': '#dc2626',

  // Orange
  'bg-orange-100': '#ffedd5',
  'bg-orange-600': '#ea580c',
  'text-orange-800': '#9a3412',
  'text-orange-600': '#ea580c',

  // Yellow
  'bg-yellow-100': '#fef3c7',
  'bg-yellow-600': '#ca8a04',
  'text-yellow-800': '#854d0e',
  'text-yellow-600': '#ca8a04',

  // Green
  'bg-green-100': '#dcfce7',
  'bg-green-600': '#16a34a',
  'text-green-800': '#166534',
  'text-green-600': '#16a34a',

  // Blue
  'bg-blue-100': '#dbeafe',
  'bg-blue-600': '#2563eb',
  'text-blue-800': '#1e40af',
  'text-blue-600': '#2563eb',

  // Indigo
  'bg-indigo-100': '#e0e7ff',
  'bg-indigo-600': '#4f46e5',
  'text-indigo-800': '#3730a3',
  'text-indigo-600': '#4f46e5',

  // Purple
  'bg-purple-100': '#f3e8ff',
  'bg-purple-600': '#9333ea',
  'text-purple-800': '#6b21a8',
  'text-purple-600': '#9333ea',

  // Pink
  'bg-pink-100': '#fce7f3',
  'bg-pink-600': '#db2777',
  'text-pink-800': '#9f1239',
  'text-pink-600': '#db2777',

  // Teal
  'bg-teal-100': '#ccfbf1',
  'bg-teal-600': '#0d9488',
  'text-teal-800': '#115e59',
  'text-teal-600': '#0d9488',

  // Cyan
  'bg-cyan-100': '#cffafe',
  'bg-cyan-600': '#0891b2',
  'text-cyan-800': '#155e75',
  'text-cyan-600': '#0891b2',
}

export function convertTailwindToHex(colorValue: string): StatusColors {
  // If it's already a hex color, return it for both
  if (colorValue.startsWith('#')) {
    return { bg: colorValue, text: '#ffffff' }
  }

  // Extract the bg-color and text-color classes
  const classes = colorValue.split(' ')
  const bgClass = classes.find(c => c.startsWith('bg-'))
  const textClass = classes.find(c => c.startsWith('text-'))

  return {
    bg: bgClass ? (TAILWIND_COLOR_MAP[bgClass] || '#6366f1') : '#6366f1',
    text: textClass ? (TAILWIND_COLOR_MAP[textClass] || '#ffffff') : '#ffffff'
  }
}
