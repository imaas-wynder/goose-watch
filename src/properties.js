const base_url = 'https://us.api.opentext.com'
const tenant_id = ''

export const properties = {
    base_url: base_url,
    tenant_id : tenant_id,
    css_url: 'https://css.us.api.opentext.com',
    infointel_url: 'https://infointel.us.api.opentext.com',
    messaging_url: 'https://t2api.us.cloudmessaging.opentext.com',
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    cms_folder: 'GooseWatch',
    cms_type: 'goose_watch',
    auth_url: `${base_url}/tenants/${tenant_id}/oauth2/token`,
    email_for_assistance: '',
}