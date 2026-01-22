import { writeFileSync } from 'fs';

// Test PDF generation
async function testPDF() {
    try {
        console.log('🧪 Testing PDF generation...\n');

        // Import the generatePDF function
        const { generatePDF } = await import('./src/lib/export-pdf.tsx');

        // Sample test data
        const testData = {
            title: 'Test Proposal',
            type: 'Business',
            sections: [
                {
                    title: 'Introduction',
                    content: '<p>This is a <strong>test</strong> introduction with <em>formatting</em>.</p>',
                    order: 0
                },
                {
                    title: 'Main Content',
                    content: '<p>Here is some main content.</p><ul><li>Point 1</li><li>Point 2</li></ul>',
                    order: 1
                }
            ],
            companyName: 'Test Company'
        };

        console.log('📄 Generating PDF with test data...');
        console.log('Title:', testData.title);
        console.log('Sections:', testData.sections.length);
        console.log('');

        const buffer = await generatePDF(testData);

        console.log('✅ PDF generated successfully!');
        console.log('Buffer size:', buffer.length, 'bytes');
        console.log('');

        // Save to file
        const outputPath = './test-output.pdf';
        writeFileSync(outputPath, buffer);
        console.log('💾 PDF saved to:', outputPath);
        console.log('');
        console.log('🎉 Test completed! Open test-output.pdf to verify.');

    } catch (error) {
        console.error('❌ Test failed!');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testPDF();
