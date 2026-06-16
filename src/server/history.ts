import { JSONFilePreset } from 'lowdb/node';

export interface PRAuditRecord {
    id: string;
    owner: string;
    repo: string;
    pullNumber: number;
    title: string;
    status: "Passed" | "Failed" | "Healed";
    healthScore: number;
    vulnerabilities: string[];
    logs: string[];
    timestamp: string;
}

export interface HistoryDB {
    audits: PRAuditRecord[];
    stats: {
        totalAudits: number;
        totalHeals: number;
        averageHealth: number;
    };
}

const defaultData: HistoryDB = { audits: [], stats: { totalAudits: 0, totalHeals: 0, averageHealth: 100 } };

export async function saveAuditRecord(record: PRAuditRecord) {
    const db = await JSONFilePreset<HistoryDB>('.history.json', defaultData);
    
    await db.read();
    db.data.audits.push(record);
    
    // Update stats
    const total = db.data.audits.length;
    const healed = db.data.audits.filter(a => a.status === "Healed").length;
    const avgHealth = db.data.audits.reduce((acc, a) => acc + a.healthScore, 0) / total;
    
    db.data.stats = {
        totalAudits: total,
        totalHeals: healed,
        averageHealth: Math.round(avgHealth)
    };

    await db.write();
    console.log(`[HISTORY] Saved audit record for PR #${record.pullNumber}. New Avg Health: ${db.data.stats.averageHealth}%`);
}

export async function getHistory(owner?: string) {
    const db = await JSONFilePreset<HistoryDB>('.history.json', defaultData);
    await db.read();
    
    if (!owner) {
        return db.data;
    }

    const filteredAudits = db.data.audits.filter(a => a.owner.toLowerCase() === owner.toLowerCase());
    
    const total = filteredAudits.length;
    const healed = filteredAudits.filter(a => a.status === "Healed").length;
    const avgHealth = total > 0 
        ? filteredAudits.reduce((acc, a) => acc + a.healthScore, 0) / total 
        : 100;

    return {
        audits: filteredAudits,
        stats: {
            totalAudits: total,
            totalHeals: healed,
            averageHealth: Math.round(avgHealth)
        }
    };
}
