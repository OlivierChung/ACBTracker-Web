import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useProfile, useUpdateProfile, useUpdateEmail, useChangePassword } from '../hooks/useProfile'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function SuccessBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 text-sm rounded-md px-4 py-2 mb-4">
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-4 text-green-600 hover:text-green-800 cursor-pointer">✕</button>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md px-4 py-2 mb-4">
      {message}
    </div>
  )
}

interface ProfileFormValues {
  firstName: string
  lastName: string
  dateOfBirth: string
}

interface EmailFormValues {
  newEmail: string
  currentPassword: string
}

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const updateEmail = useUpdateEmail()
  const changePassword = useChangePassword()

  const [profileSuccess, setProfileSuccess] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const profileForm = useForm<ProfileFormValues>()
  const emailForm = useForm<EmailFormValues>()
  const passwordForm = useForm<PasswordFormValues>()

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth ?? '',
      })
    }
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onProfileSubmit(values: ProfileFormValues) {
    await updateProfile.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth || null,
    })
    setProfileSuccess(true)
  }

  async function onEmailSubmit(values: EmailFormValues) {
    try {
      await updateEmail.mutateAsync(values)
      emailForm.reset()
      setEmailSuccess(true)
    } catch {
      emailForm.setError('root', { message: 'Failed to update email. Check your password.' })
    }
  }

  async function onPasswordSubmit(values: PasswordFormValues) {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Passwords do not match.' })
      return
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      passwordForm.reset()
      setPasswordSuccess(true)
    } catch {
      passwordForm.setError('root', { message: 'Failed to change password. Check your current password.' })
    }
  }

  if (isLoading) return <p className="text-gray-500">Loading…</p>

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>

      {/* Personal info */}
      <Section title="Personal information">
        {profileSuccess && (
          <SuccessBanner message="Profile updated." onDismiss={() => setProfileSuccess(false)} />
        )}
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              {...profileForm.register('firstName', { required: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              {...profileForm.register('lastName', { required: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth (optional)</label>
            <input
              {...profileForm.register('dateOfBirth')}
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change email */}
      <Section title="Email address">
        <p className="text-sm text-gray-500 mb-4">Current: <span className="font-medium text-gray-900">{profile?.email}</span></p>
        {emailSuccess && (
          <SuccessBanner message="Email updated." onDismiss={() => setEmailSuccess(false)} />
        )}
        {emailForm.formState.errors.root && (
          <ErrorBanner message={emailForm.formState.errors.root.message!} />
        )}
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New email address</label>
            <input
              {...emailForm.register('newEmail', { required: true })}
              type="email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input
              {...emailForm.register('currentPassword', { required: true })}
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateEmail.isPending}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {updateEmail.isPending ? 'Updating…' : 'Update email'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Password">
        {passwordSuccess && (
          <SuccessBanner message="Password changed." onDismiss={() => setPasswordSuccess(false)} />
        )}
        {passwordForm.formState.errors.root && (
          <ErrorBanner message={passwordForm.formState.errors.root.message!} />
        )}
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input
              {...passwordForm.register('currentPassword', { required: true })}
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              {...passwordForm.register('newPassword', { required: true, minLength: { value: 8, message: 'Minimum 8 characters' } })}
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-red-600 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              {...passwordForm.register('confirmPassword', { required: true })}
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {changePassword.isPending ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  )
}
