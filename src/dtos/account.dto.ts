export interface CreateAccountDto {
  roleId: string
  username: string
  password: string
  email: string
  phoneNumber?: string
}

export interface UpdateAccountDto {
  username?: string
  email?: string
  phoneNumber?: string
  avatarId?: string
  emailIsVerified?: boolean
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface GetAccountByUsernameDto {
  username: string
}

export interface GetAccountByEmailDto {
  email: string
}

export interface ResetPasswordDto {
  email: string
  newPassword: string
}

export interface GetAccountsDto {
  filter: AccountFilter
  page: number
  limit: number
}

export interface CheckAccountExistsDto {
  username: string
  email?: string
  phoneNumber?: string
}

export interface AccountFilter {
  roleId?: string
  emailIsVerified?: boolean
  searchTerm?: string
}
