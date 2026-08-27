#!/usr/bin/env bash
# Start Next.js dev server, fully detached from the parent bash session.
cd /home/z/my-project/Tare-Wellness
unset DATABASE_URL DIRECT_URL
exec setsid ./node_modules/.bin/next dev -p 3000 > /tmp/tare-dev.log 2>&1 < /dev/null &
