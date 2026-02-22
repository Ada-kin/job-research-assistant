export function isNewUiEnabledServer(): boolean {
  return process.env.NEXT_PUBLIC_NEW_UI_ENABLED === 'true';
}

export function isNewUiEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_NEW_UI_ENABLED === 'true';
}
