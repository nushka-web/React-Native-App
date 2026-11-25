import type { Metadata } from 'next';
import AccountDeletionForm from '@/components/AccountDeletionForm';

export const metadata: Metadata = {
  title: 'Request Account Deletion — Arthum AI',
  description:
    'Request the deletion of your Arthum AI account. Enter your registered email and password to begin the account deletion process.',
};

export default function AccountDeletionPage() {
  return <AccountDeletionForm />;
}
