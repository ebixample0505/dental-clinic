export const checkAdminAuth = () => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('admin_authenticated') === 'true';
};

export const requireAdminAuth = (_router: any) => {
  if (!checkAdminAuth()) {
    window.location.href = '/admin/login';
    return false;
  }
  return true;
};

export const adminLogout = (_router: any) => {
  sessionStorage.removeItem('admin_authenticated');
  window.location.href = '/admin/login';
};