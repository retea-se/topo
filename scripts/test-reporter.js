/**
 * Custom Playwright Reporter
 * Generates TEST_RUN_REPORT.md with test results, screenshots, and console errors
 */

const fs = require('fs');
const path = require('path');

class TestReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || 'exports/TEST_RUN_REPORT.md';
    this.results = [];
    this.consoleErrors = [];
    this.startTime = null;
    this.endTime = null;
  }

  onBegin(config, suite) {
    this.startTime = new Date();
    // Ensure exports directory exists
    const exportsDir = path.dirname(this.outputFile);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
  }

  onTestBegin(test) {
    // Track console errors per test
    this.currentTestErrors = [];
  }

  onTestEnd(test, result) {
    const testResult = {
      title: test.title,
      file: test.location?.file || 'unknown',
      status: result.status,
      duration: result.duration,
      errors: result.errors || [],
      attachments: result.attachments || [],
      consoleErrors: [...this.currentTestErrors]
    };

    this.results.push(testResult);
    this.currentTestErrors = [];
  }

  onStdErr(chunk, test, result) {
    if (test) {
      const errorText = chunk.toString();
      if (errorText.trim()) {
        this.currentTestErrors.push({
          test: test.title,
          error: errorText.trim(),
          timestamp: new Date().toISOString()
        });
        this.consoleErrors.push({
          test: test.title,
          error: errorText.trim(),
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  onEnd(result) {
    this.endTime = new Date();
    this.generateReport(result);
  }

  generateReport(result) {
    const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;

    let report = `# Test Run Report\n\n`;
    report += `**Date:** ${this.startTime.toLocaleString('sv-SE')}\n`;
    report += `**Duration:** ${duration}s\n`;
    report += `**Total Tests:** ${total}\n`;
    report += `**Passed:** ${passed} ✅\n`;
    report += `**Failed:** ${failed} ❌\n`;
    report += `**Skipped:** ${skipped} ⏭️\n\n`;
    report += `---\n\n`;

    // Test Results
    report += `## Test Results\n\n`;

    for (const testResult of this.results) {
      const statusIcon = testResult.status === 'passed' ? '✅' :
                        testResult.status === 'failed' ? '❌' : '⏭️';

      report += `### ${statusIcon} ${testResult.title}\n\n`;
      report += `- **File:** \`${testResult.file}\`\n`;
      report += `- **Status:** ${testResult.status}\n`;
      report += `- **Duration:** ${(testResult.duration / 1000).toFixed(2)}s\n`;

      // Screenshots and attachments
      const screenshots = testResult.attachments.filter(a => a.name === 'screenshot' || a.path?.endsWith('.png'));
      const htmlDumps = testResult.attachments.filter(a => a.name === 'page-html' || a.path?.endsWith('.html'));

      if (screenshots.length > 0) {
        report += `- **Screenshots:**\n`;
        for (const screenshot of screenshots) {
          const relativePath = screenshot.path ? path.relative(process.cwd(), screenshot.path) : screenshot.path;
          report += `  - \`${relativePath}\`\n`;
        }
      }

      if (htmlDumps.length > 0) {
        report += `- **HTML Dumps:**\n`;
        for (const htmlDump of htmlDumps) {
          const relativePath = htmlDump.path ? path.relative(process.cwd(), htmlDump.path) : htmlDump.path;
          report += `  - \`${relativePath}\`\n`;
        }
      }

      // Errors
      if (testResult.errors.length > 0) {
        report += `- **Errors:**\n`;
        for (const error of testResult.errors) {
          report += `  \`\`\`\n`;
          report += `  ${error.message || String(error)}\n`;
          if (error.stack) {
            report += `  ${error.stack.split('\n').slice(0, 5).join('\n  ')}\n`;
          }
          report += `  \`\`\`\n`;
        }
      }

      // Console errors for this test
      if (testResult.consoleErrors.length > 0) {
        report += `- **Console Errors:**\n`;
        for (const consoleError of testResult.consoleErrors) {
          report += `  - \`${consoleError.error}\`\n`;
        }
      }

      report += `\n`;
    }

    // Console Errors Summary
    if (this.consoleErrors.length > 0) {
      report += `---\n\n`;
      report += `## Console Errors Summary\n\n`;
      report += `Total console errors: ${this.consoleErrors.length}\n\n`;

      for (const error of this.consoleErrors) {
        report += `- **${error.test}:** \`${error.error}\`\n`;
      }
      report += `\n`;
    }

    // Summary
    report += `---\n\n`;
    report += `## Summary\n\n`;
    report += `- ✅ Passed: ${passed}/${total}\n`;
    report += `- ❌ Failed: ${failed}/${total}\n`;
    report += `- ⏭️ Skipped: ${skipped}/${total}\n`;

    if (failed > 0) {
      report += `\n**⚠️ Some tests failed. Review the errors above.**\n`;
    } else if (this.consoleErrors.length > 0) {
      report += `\n**⚠️ Tests passed but console errors were detected. Review the console errors section.**\n`;
    } else {
      report += `\n**✅ All tests passed with no console errors.**\n`;
    }

    // Write report
    fs.writeFileSync(this.outputFile, report, 'utf8');
    console.log(`\n📄 Test report generated: ${this.outputFile}`);
  }
}

module.exports = TestReporter;

