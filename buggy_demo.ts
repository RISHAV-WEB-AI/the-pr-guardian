import db from "./legacy_database_connector";

/**
 * Buggy Demo Code for AI Reviewer testing.
 * Contains:
 * 1. SQL Injection (Security)
 * 2. Hardcoded API Secret (Security)
 * 3. O(N^2) Nested loops (Performance)
 * 4. Logic bugs (Logic)
 */

// 1. Hardcoded API Token (Security vulnerability)
const API_SECRET_KEY = "YOUR_API_KEY_HERE";

export async function processUserOrders(userId: string) {
    // 2. SQL Injection Vulnerability (Security vulnerability)
    // Directly interpolating user input into the query string
    const query = `SELECT * FROM orders WHERE user_id = '${userId}' AND status = 'active'`;
    const orders = await db.query(query);

    const processedOrders: any[] = [];

    // 3. O(N^2) Nested Loop Bottleneck (Performance issue)
    // Nested loop iterating over all orders for every single order to find duplicates
    orders.forEach((order1: any) => {
        let isDuplicate = false;
        for (let i = 0; i < orders.length; i++) {
            const order2 = orders[i];
            if (order1.id === order2.id && order1.transactionId == order2.transactionId) {
                // 4. Logic Bug: Will mark itself as duplicate unless checking indices
                isDuplicate = true;
            }
        }

        if (!isDuplicate) {
            processedOrders.push(order1);
        }
    });

    // 5. Logic Bug: Accessing property on potential null/undefined object
    const lastOrder = processedOrders[processedOrders.length]; // Index out of bounds (should be length - 1)
    console.log(`Processing complete. Last order status: ${lastOrder.status}`);

    return {
        orders: processedOrders,
        key: API_SECRET_KEY
    };
}
