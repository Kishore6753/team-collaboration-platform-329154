#!/bin/bash
cd /home/kavia/workspace/code-generation/team-collaboration-platform-329154/task_tracker_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

