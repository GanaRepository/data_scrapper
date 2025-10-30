import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if clone exists
    const cloneDir = path.join(process.cwd(), 'public', 'clones', id);
    const htmlPath = path.join(cloneDir, 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      return new NextResponse('Clone not found', { status: 404 });
    }
    
    // Read and return the HTML file
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('Error serving clone:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}