//file path: app/dashboard/settings/components/shared/SuccessMessage.tsx
'use client'

import { CheckIcon } from '@heroicons/react/24/outline'

export default function SuccessMessage() {
  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <CheckIcon className="h-5 w-5 text-green-400" />
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
        </div>
      </div>
    </div>
  )
}
