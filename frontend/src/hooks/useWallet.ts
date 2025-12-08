import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wallet } from '@/lib/api';
import { useToast } from '@/components';

export const useWallet = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get wallet balance
  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      const response = await wallet.getBalance();
      return response.data.data;
    },
  });

  // Get transactions
  const useTransactions = (page = 1, limit = 20) => {
    return useQuery({
      queryKey: ['wallet', 'transactions', page, limit],
      queryFn: async () => {
        const response = await wallet.getTransactions(page, limit);
        return response.data;
      },
    });
  };

  // Fund wallet
  const fundWallet = useMutation({
    mutationFn: async (data: { amount: number; callbackUrl?: string }) => {
      const response = await wallet.fund(data.amount, data.callbackUrl);
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Paystack
      if (data.data.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      }
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Failed to initiate payment');
    },
  });

  // Verify funding
  const verifyFunding = useMutation({
    mutationFn: async (reference: string) => {
      const response = await wallet.verifyFunding(reference);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      showToast('success', 'Wallet funded successfully');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Payment verification failed');
    },
  });

  // Withdraw funds
  const withdraw = useMutation({
    mutationFn: async (data: {
      amount: number;
      bankAccount: {
        accountNumber: string;
        bankCode: string;
        accountName?: string;
      };
      reason?: string;
    }) => {
      const response = await wallet.withdraw(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      showToast('success', 'Withdrawal initiated successfully');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Withdrawal failed');
    },
  });

  // Get banks
  const { data: banks } = useQuery({
    queryKey: ['wallet', 'banks'],
    queryFn: async () => {
      const response = await wallet.getBanks();
      return response.data.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Resolve account
  const resolveAccount = useMutation({
    mutationFn: async (data: { accountNumber: string; bankCode: string }) => {
      const response = await wallet.resolveAccount(data.accountNumber, data.bankCode);
      return response.data.data;
    },
  });

  return {
    balance,
    isLoadingBalance,
    useTransactions,
    fundWallet,
    verifyFunding,
    withdraw,
    banks,
    resolveAccount,
  };
};
