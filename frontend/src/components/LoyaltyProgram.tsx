import { useState } from 'react';
import { useAppContext, type LoyaltyReward, type LoyaltyRule } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Gift,
  Crown,
  Trophy,
  TrendingUp,
  Users,
  IndianRupee,
  Calendar,
  Target,
  Award,
  Heart,
  Sparkles,
  Percent
} from 'lucide-react';



export function LoyaltyProgram() {
  const {
    customers,
    loyaltyRewards,
    loyaltyRules,
    addLoyaltyReward,
    addLoyaltyRule,
    updateLoyaltyReward,
    updateLoyaltyRule,
    deleteLoyaltyReward,
    deleteLoyaltyRule,
    addNotification,
    redeemLoyaltyPoints,
    updateCustomer,
    generateReferralCode
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [activeTab, setActiveTab] = useState('members');
  const [isAddRewardDialogOpen, setIsAddRewardDialogOpen] = useState(false);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    pointsRequired: 100,
    type: 'discount' as const,
    value: 10,
    maxRedemptions: 0
  });
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'earn' as const,
    condition: '',
    pointsPerRupee: 1,
    bonusPoints: 50,
    minOrderValue: 500
  });

  // Use customers as loyalty members (unified system)
  const members = customers;

  // Use loyalty rewards and rules from context instead of local state
  const rewards = loyaltyRewards;
  const rules = loyaltyRules;

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm);
    const matchesTier = selectedTier === 'all' || (member.loyaltyTier && member.loyaltyTier === selectedTier);
    return matchesSearch && matchesTier;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-700';
      case 'silver': return 'bg-slate-100 text-slate-700';
      case 'gold': return 'bg-yellow-100 text-yellow-700';
      case 'platinum': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="w-4 h-4" />;
      case 'silver': return <Star className="w-4 h-4" />;
      case 'gold': return <Crown className="w-4 h-4" />;
      case 'platinum': return <Trophy className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const handleAddReward = () => {
    if (!newReward.title || !newReward.description) {
      return;
    }
    
    const reward = {
      id: `reward_${Date.now()}`,
      ...newReward,
      currentRedemptions: 0,
      isActive: true
    };
    addLoyaltyReward(reward);
    setNewReward({
      title: '',
      description: '',
      pointsRequired: 100,
      type: 'discount',
      value: 10,
      maxRedemptions: 0
    });
    setIsAddRewardDialogOpen(false);
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.condition) {
      return;
    }
    
    const rule = {
      id: `rule_${Date.now()}`,
      ...newRule,
      isActive: true
    };
    addLoyaltyRule(rule);
    setNewRule({
      name: '',
      type: 'earn',
      condition: '',
      pointsPerRupee: 1,
      bonusPoints: 50,
      minOrderValue: 500
    });
    setIsAddRuleDialogOpen(false);
  };

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const totalPointsIssued = members.reduce((sum, m) => sum + (m.loyaltyPoints || 0), 0);
  const averagePointsPerMember = totalMembers > 0 ? Math.round(totalPointsIssued / totalMembers) : 0;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Star className="text-primary" size={24} />
            Loyalty Program
          </h1>
          <p className="text-muted-foreground mt-1">Manage customer loyalty and rewards</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="font-semibold">{totalMembers}</p>
              </div>
              <Users className="text-primary" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="font-semibold text-green-600">{activeMembers}</p>
              </div>
              <Heart className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points Issued</p>
                <p className="font-semibold">{totalPointsIssued.toLocaleString()}</p>
              </div>
              <Sparkles className="text-primary" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Points</p>
                <p className="font-semibold">{averagePointsPerMember}</p>
              </div>
              <Target className="text-primary" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter size={18} />
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.phone}</p>
                      {member.email && (
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                    <Badge className={getTierColor(member.loyaltyTier || 'bronze')} variant="secondary">
                      <div className="flex items-center gap-1">
                        {getTierIcon(member.loyaltyTier || 'bronze')}
                        {(member.loyaltyTier || 'bronze').toUpperCase()}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="font-semibold text-lg text-primary">{member.loyaltyPoints || 0}</div>
                      <div className="text-xs text-muted-foreground">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">₹{(member.totalSpent || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{member.totalOrders || 0}</div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {member.joinDate && <div>Joined: {new Date(member.joinDate).toLocaleDateString()}</div>}
                    {member.lastVisit && <div>Last visit: {new Date(member.lastVisit).toLocaleDateString()}</div>}
                    {(member.referralCount || 0) > 0 && (
                      <div className="text-green-600">
                        Referred: {member.referralCount} customer{member.referralCount > 1 ? 's' : ''}
                      </div>
                    )}
                    {member.referredBy && (
                      <div className="text-blue-600 text-xs">
                        Referred by a member
                      </div>
                    )}
                  </div>
                  <div className="bg-muted p-2 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span>Referral Code:</span>
                      <code className="font-mono bg-background px-2 py-1 rounded">{member.referralCode || 'N/A'}</code>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Gift size={16} />
                      Redeem
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2>Available Rewards</h2>
            <Dialog open={isAddRewardDialogOpen} onOpenChange={setIsAddRewardDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={18} />
                  Add Reward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Reward</DialogTitle>
                  <DialogDescription>
                    Add a new reward for loyalty program members
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Reward Title *</Label>
                    <Input
                      id="title"
                      value={newReward.title}
                      onChange={(e) => setNewReward({...newReward, title: e.target.value})}
                      placeholder="Enter reward title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Reward Type *</Label>
                    <Select value={newReward.type} onValueChange={(value) => setNewReward({...newReward, type: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="free_item">Free Item</SelectItem>
                        <SelectItem value="cashback">Cashback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsRequired">Points Required *</Label>
                    <Input
                      id="pointsRequired"
                      type="number"
                      value={newReward.pointsRequired}
                      onChange={(e) => setNewReward({...newReward, pointsRequired: parseInt(e.target.value) || 100})}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Value *</Label>
                    <Input
                      id="value"
                      type="number"
                      value={newReward.value}
                      onChange={(e) => setNewReward({...newReward, value: parseFloat(e.target.value) || 10})}
                      placeholder={newReward.type === 'discount' ? '10 (%)' : '150 (₹)'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      value={newReward.maxRedemptions}
                      onChange={(e) => setNewReward({...newReward, maxRedemptions: parseInt(e.target.value) || 0})}
                      placeholder="0 (unlimited)"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={newReward.description}
                      onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                      placeholder="Enter reward description"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddRewardDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddReward}>
                    Create Reward
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {reward.type === 'discount' && <Percent size={16} className="text-green-500" />}
                      {reward.type === 'free_item' && <Gift size={16} className="text-blue-500" />}
                      {reward.type === 'cashback' && <IndianRupee size={16} className="text-purple-500" />}
                      <Switch checked={reward.isActive} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="font-semibold text-lg text-primary">{reward.pointsRequired}</div>
                      <div className="text-xs text-muted-foreground">Points Required</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">
                        {reward.type === 'discount' ? `${reward.value}%` : `₹${reward.value}`}
                      </div>
                      <div className="text-xs text-muted-foreground">Value</div>
                    </div>
                  </div>
                  {reward.maxRedemptions && (
                    <div className="text-sm text-muted-foreground">
                      Redeemed: {reward.currentRedemptions}/{reward.maxRedemptions}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2>Loyalty Rules</h2>
            <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={18} />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Rule</DialogTitle>
                  <DialogDescription>
                    Define how customers earn loyalty points
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name *</Label>
                    <Input
                      id="ruleName"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruleType">Rule Type *</Label>
                    <Select value={newRule.type} onValueChange={(value) => setNewRule({...newRule, type: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earn">Earning Rule</SelectItem>
                        <SelectItem value="bonus">Bonus Rule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="condition">Condition *</Label>
                    <Input
                      id="condition"
                      value={newRule.condition}
                      onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                      placeholder="Describe when this rule applies"
                    />
                  </div>
                  {newRule.type === 'earn' && (
                    <div className="space-y-2">
                      <Label htmlFor="pointsPerRupee">Points per Rupee</Label>
                      <Input
                        id="pointsPerRupee"
                        type="number"
                        step="0.1"
                        value={newRule.pointsPerRupee}
                        onChange={(e) => setNewRule({...newRule, pointsPerRupee: parseFloat(e.target.value) || 1})}
                        placeholder="1"
                      />
                    </div>
                  )}
                  {newRule.type === 'bonus' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="bonusPoints">Bonus Points</Label>
                        <Input
                          id="bonusPoints"
                          type="number"
                          value={newRule.bonusPoints}
                          onChange={(e) => setNewRule({...newRule, bonusPoints: parseInt(e.target.value) || 50})}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minOrderValue">Min Order Value</Label>
                        <Input
                          id="minOrderValue"
                          type="number"
                          value={newRule.minOrderValue}
                          onChange={(e) => setNewRule({...newRule, minOrderValue: parseInt(e.target.value) || 500})}
                          placeholder="500"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRule}>
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={rule.type === 'earn' ? 'default' : 'secondary'}>
                          {rule.type === 'earn' ? 'Earning' : 'Bonus'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{rule.condition}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        {rule.pointsPerRupee && (
                          <span>Points per ₹: <strong>{rule.pointsPerRupee}</strong></span>
                        )}
                        {rule.bonusPoints && (
                          <span>Bonus Points: <strong>{rule.bonusPoints}</strong></span>
                        )}
                        {rule.minOrderValue && (
                          <span>Min Order: <strong>₹{rule.minOrderValue}</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={rule.isActive} />
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
              <p className="text-muted-foreground">Track customer referrals and bonuses</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Referrals</p>
                          <p className="font-semibold">{members.reduce((sum, m) => sum + (m.referralCount || 0), 0)}</p>
                        </div>
                        <Users className="text-primary" size={24} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Top Referrers</p>
                          <p className="font-semibold">{members.filter(m => (m.referralCount || 0) > 0).length}</p>
                        </div>
                        <Trophy className="text-primary" size={24} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Referred Members</p>
                          <p className="font-semibold">{members.filter(m => m.referredBy).length}</p>
                        </div>
                        <Heart className="text-primary" size={24} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="mb-4">Top Referrers</h3>
                  <div className="space-y-3">
                    {members
                      .filter(m => (m.referralCount || 0) > 0)
                      .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
                      .slice(0, 10)
                      .map((member, index) => (
                        <Card key={member.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-muted-foreground">{member.phone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{member.referralCount || 0} Referrals</p>
                                <p className="text-sm text-muted-foreground">
                                  Code: <code className="bg-muted px-2 py-1 rounded">{member.referralCode}</code>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">How Referrals Work</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Each customer gets a unique referral code</li>
                    <li>• New customers get 100 bonus points when they use a referral code</li>
                    <li>• Referrers get 200 bonus points for each successful referral</li>
                    <li>• Track all referrals in the Members tab</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Member growth chart would go here</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Points Redemption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Points redemption analytics would go here</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}