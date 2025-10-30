import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const clonesIndexPath = path.join(process.cwd(), 'public', 'clones', 'index.json');
    
    if (!fs.existsSync(clonesIndexPath)) {
      return NextResponse.json([]);
    }
    
    const clonesIndex = JSON.parse(fs.readFileSync(clonesIndexPath, 'utf8'));
    return NextResponse.json(clonesIndex);
    
  } catch (error) {
    console.error('Error fetching clones:', error);
    return NextResponse.json({ error: 'Failed to fetch clones' }, { status: 500 });
  }
}