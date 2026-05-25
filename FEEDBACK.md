# Player feedback

This file is where player-submitted suggestions and bug reports land in the
repo, so `git pull` is enough to see them. The Flag Game container can't push
on its own — the workflow is to dump them on the Pi and commit the file here.

## How to refresh this file

SSH to the Pi and run, from the host:

```bash
docker exec flag-game node server/feedback-dump.js > /tmp/FEEDBACK.md
docker cp <flag-game-container>:/tmp/FEEDBACK.md ./FEEDBACK.md  # if needed
```

Or, simplest — `scp` the dump down:

```bash
ssh pi 'docker exec flag-game node server/feedback-dump.js' > FEEDBACK.md
```

Then commit FEEDBACK.md and push.

## Live source

- SQLite table: `feedback` (id, user_id, username, category, body, created_at, resolved_at)
- Append-only mirror on the Pi: `/data/feedback.jsonl`
- Admin inbox in-app: click the megaphone icon in the top bar (admin sees the list + resolve/delete controls; everyone else just sees the submit form).

## Submissions

_No feedback submitted yet — this section gets overwritten by `feedback-dump.js`._
