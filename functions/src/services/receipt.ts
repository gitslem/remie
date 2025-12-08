import * as admin from 'firebase-admin';

const db = admin.firestore();

export const generateReceipt = async (paymentId: string, payment: any): Promise<void> => {
  try {
    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create receipt record
    await db.collection('receipts').doc().set({
      userId: payment.userId,
      paymentId,
      receiptNumber,
      amount: payment.amount,
      paymentType: payment.type,
      institutionName: payment.institutionName || 'N/A',
      description: payment.description,
      status: payment.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create notification for receipt
    await db.collection('notifications').doc().set({
      userId: payment.userId,
      type: 'RECEIPT_READY',
      title: 'Receipt Generated',
      message: `Your receipt ${receiptNumber} is ready`,
      read: false,
      data: { receiptNumber, paymentId },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Receipt generated: ${receiptNumber}`);
  } catch (error) {
    console.error('Receipt generation failed:', error);
  }
};
