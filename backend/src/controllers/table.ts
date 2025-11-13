import { Request, Response } from 'express';

const mapTableRecord = (table: any) => ({
  id: table.id,
  number: table.number,
  name: table.name,
  status: (table.status || 'FREE').toLowerCase(),
  capacity: table.capacity,
  location: table.location,
  notes: table.notes,
  guests: table.guests || 0,
  currentOrderId: table.currentOrderId || null,
  lastOrderAt: table.lastOrderAt,
  createdAt: table.createdAt,
  updatedAt: table.updatedAt,
});

export async function getAllTables(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  try {
    const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
    res.json(tables.map(mapTableRecord));
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
}

export async function getTableById(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(mapTableRecord(table));
  } catch (error) {
    console.error(`Error fetching table ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
}

export async function createTable(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  try {
    const {
      number,
      capacity,
      status = 'FREE',
      name,
      location,
      notes,
    } = req.body;

    if (typeof number !== 'number' || typeof capacity !== 'number') {
      return res.status(400).json({ error: 'number and capacity are required numeric fields.' });
    }

    const table = await prisma.table.create({
      data: {
        number,
        capacity,
        status: String(status).toUpperCase(),
        name,
        location,
        notes,
      },
    });

    res.status(201).json(mapTableRecord(table));
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
}

export async function updateTable(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const { id } = req.params;
  try {
    const { status, ...data } = req.body;
    if (status) {
      data.status = String(status).toUpperCase();
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data,
    });
    res.json(mapTableRecord(updatedTable));
  } catch (error) {
    console.error(`Error updating table ${id}:`, error);
    res.status(500).json({ error: 'Failed to update table' });
  }
}

export async function deleteTable(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  const { id } = req.params;
  try {
    await prisma.table.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting table ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
}

export async function getTableStats(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  try {
    const [total, occupied, reserved, cleaning] = await Promise.all([
      prisma.table.count(),
      prisma.table.count({ where: { status: 'OCCUPIED' } }),
      prisma.table.count({ where: { status: 'RESERVED' } }),
      prisma.table.count({ where: { status: 'CLEANING' } }),
    ]);

    const free = total - occupied - reserved - cleaning;

    res.json({
      total,
      occupied,
      reserved,
      cleaning,
      free: free < 0 ? 0 : free,
    });
  } catch (error) {
    console.error('Error fetching table stats:', error);
    res.status(500).json({ error: 'Failed to fetch table stats' });
  }
}

export async function searchTables(req: Request, res: Response) {
  const prisma = (req as any).prisma;
  try {
    const { number, status, capacity } = req.query;
    const filters: any = {};

    if (number) {
      filters.number = Number(number);
    }

    if (capacity) {
      filters.capacity = Number(capacity);
    }

    if (status) {
      filters.status = String(status).toUpperCase();
    }

    const tables = await prisma.table.findMany({ where: filters, orderBy: { number: 'asc' } });
    res.json(tables.map(mapTableRecord));
  } catch (error) {
    console.error('Error searching tables:', error);
    res.status(500).json({ error: 'Failed to search tables' });
  }
}
