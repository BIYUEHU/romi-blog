export const environment = {
  api_base_url:
    typeof process !== 'undefined'
      ? `http://127.0.0.1:${Number((process.env as { PORT: string }).PORT ?? 4200) - 1}/api`
      : '/api'
}
