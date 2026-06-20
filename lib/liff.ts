'use client';
import liff from '@line/liff';

export const initLiff = async () => {
  await liff.init({
    liffId: '2010454791-miMuAYxd', // 直書きで確認
  });
  if (!liff.isLoggedIn()) {
    liff.login();
  }
};

export const getUserProfile = async () => {
  const profile = await liff.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  };
};