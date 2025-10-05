import { useLocalSearchParams } from 'expo-router';
import { PaymentWebView } from '../../components/PaymentWebView';

export default function PaymentWebViewScreen() {
  const { paymentUrl, orderId } = useLocalSearchParams<{
    paymentUrl: string;
    orderId: string;
  }>();

  if (!paymentUrl || !orderId) {
    return null;
  }

  return (
    <PaymentWebView
      paymentUrl={paymentUrl}
      orderId={parseInt(orderId)}
      onSuccess={(data) => {
        console.log('Payment successful:', data);
      }}
      onFailure={(error) => {
        console.log('Payment failed:', error);
      }}
    />
  );
}
