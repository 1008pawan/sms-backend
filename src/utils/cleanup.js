const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Folder jahan resumes save ho rahe hain
const directory = path.join(__dirname, 'uploads');

// Har raat 12 baje (00:00) ye function chalega
cron.schedule('0 0 * * *', () => {
  console.log('Running background cleanup: Checking for old resumes...');

  fs.readdir(directory, (err, files) => {
    if (err) return console.error("Could not list the directory.", err);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) return console.error(err);

        // 30 din ka time milliseconds mein
        const now = Date.now();
        const endTime = new Date(stats.mtime).getTime() + (30 * 24 * 60 * 60 * 1000);

        if (now > endTime) {
          fs.unlink(filePath, (err) => {
            if (err) return console.error(err);
            console.log(`Deleted old file: ${file}`);
          });
        }
      });
    });
  });
});