import re

with open("src/app/formazioni/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix Pitch Height on Mobile
# <div className="relative w-full max-w-4xl mx-auto mb-8 perspective-[1200px] mt-6 md:mt-12 h-[350px] md:h-[500px]">
content = re.sub(
    r'h-\[350px\] md:h-\[500px\]',
    r'h-[450px] md:h-[600px]',
    content
)

# 2. Fix Header "Como vs Roma" (Remove borders, fix logos, add VS dot)
old_header = """              <div className="flex items-center justify-center gap-6 md:gap-16">
                <div className="flex items-center gap-3 bg-card p-2 rounded-xl shadow-sm border border-border">
                  <span className="font-bold text-sm md:text-xl text-gray-900 dark:text-[#ffffff]">{matchState.homeTeam}</span>
                  <img src={matchState.homeLogo} alt={matchState.homeTeam} className="w-8 h-8 md:w-12 md:h-12 object-contain bg-[#ffffff] rounded-md p-1" />
                </div>
                <div className="text-xl font-bold text-gray-400">VS</div>
                <div className="flex items-center gap-3 bg-card p-2 rounded-xl shadow-sm border border-primary/20">
                  <img src={matchState.awayLogo} alt={matchState.awayTeam} className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                  <span className="font-bold text-sm md:text-xl text-primary">{matchState.awayTeam}</span>
                </div>
              </div>"""

new_header = """              <div className="flex items-center justify-center gap-6 md:gap-16">
                <div className="flex items-center gap-3">
                  {matchState.homeTeam === 'Roma' && <img src={matchState.homeLogo} alt="Roma" className="w-8 h-8 md:w-12 md:h-12 object-contain" />}
                  <span className={`font-bold text-lg md:text-2xl ${matchState.homeTeam === 'Roma' ? 'text-primary' : 'text-gray-900 dark:text-[#ffffff]'}`}>{matchState.homeTeam}</span>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs md:text-sm font-bold text-gray-500 shadow-inner">VS</div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg md:text-2xl ${matchState.awayTeam === 'Roma' ? 'text-primary' : 'text-gray-900 dark:text-[#ffffff]'}`}>{matchState.awayTeam}</span>
                  {matchState.awayTeam === 'Roma' && <img src={matchState.awayLogo} alt="Roma" className="w-8 h-8 md:w-12 md:h-12 object-contain" />}
                </div>
              </div>"""

content = content.replace(old_header, new_header)

# 3. Add VS Dot between TeamLists
old_team_lists = """            {/* TWO COLUMNS LISTS */}
            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <TeamList teamName={matchState.homeTeam} formation={homeState.formation} players={homeState} isAway={false} />
              <TeamList teamName={matchState.awayTeam} formation={awayState.formation} players={awayState} isAway={true} />
            </div>"""

new_team_lists = """            {/* TWO COLUMNS LISTS */}
            <div className="flex flex-col md:flex-row gap-4 mt-6 relative">
              <TeamList teamName={matchState.homeTeam} formation={homeState.formation} players={homeState} isAway={false} />
              
              {/* VS DOT BETWEEN LISTS */}
              <div className="hidden md:flex absolute left-1/2 top-3 -translate-x-1/2 w-8 h-8 rounded-full bg-[#ffffff] border border-border items-center justify-center text-[10px] font-bold text-gray-400 z-10 shadow-sm">VS</div>
              
              <TeamList teamName={matchState.awayTeam} formation={awayState.formation} players={awayState} isAway={true} />
            </div>"""

content = content.replace(old_team_lists, new_team_lists)

with open("src/app/formazioni/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Applied UI fixes for mobile pitch height, header logos, and VS dot.")
