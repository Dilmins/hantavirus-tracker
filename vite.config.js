- name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Node dependencies
        run: npm install

      - name: Build Vite app
        run: npm run build

      - name: Fetch hantavirus data
        run: |
          python fetch_hantavirus_data.py

      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git diff --quiet && git diff --staged --quiet || (git commit -m "chore: update hantavirus data [$(date '+%Y-%m-%d %H:%M:%S UTC')]" && git push)
