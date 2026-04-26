import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  return uri;
}

export async function GET() {
  let client: MongoClient | undefined;
  try {
    client = new MongoClient(getUri());
    await client.connect();
    const db = client.db();

    const since = new Date(Date.now() - 60_000);

    const [byName, totalLastMinute, ordersCount, dlqCount, recentDlq, processedCount] = await Promise.all([
      db
        .collection('metric_events')
        .aggregate<{ _id: string; count: number }>([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: '$name', count: { $sum: 1 } } },
          { $sort: { count: -1 as const } },
        ])
        .toArray(),
      db.collection('metric_events').countDocuments({ createdAt: { $gte: since } }),
      db.collection('orders').countDocuments(),
      db.collection('dlq_records').countDocuments(),
      db
        .collection('dlq_records')
        .find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .project({
          originalSubject: 1,
          originalEventId: 1,
          orderId: 1,
          error: 1,
          attempts: 1,
          createdAt: 1,
        })
        .toArray(),
      db.collection('processed_events').countDocuments(),
    ]);

    const byMetricName = Object.fromEntries(byName.map((x) => [x._id, x.count]));

    return NextResponse.json({
      windowSeconds: 60,
      eventsLastMinute: totalLastMinute,
      eventsPerSecond: Number((totalLastMinute / 60).toFixed(2)),
      byMetricName,
      totals: {
        orders: ordersCount,
        dlq: dlqCount,
        processedEvents: processedCount,
      },
      recentDlq: recentDlq.map((doc) => ({
        id: String(doc._id),
        originalSubject: doc.originalSubject,
        originalEventId: doc.originalEventId,
        orderId: doc.orderId,
        error: doc.error,
        attempts: doc.attempts,
        createdAt: doc.createdAt,
      })),
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client?.close();
  }
}
