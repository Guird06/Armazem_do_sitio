import Sale from "../models/Sales/Sale.js";

class SalesController {
    async salesDashboard(req, res) {
        try {
            const sales = (await Sale.findAll({ order: [['createdAt', 'DESC']] })).map(sale => sale.get({ plain: true }));

            const stats = this.getSalesStats(sales);
            const categories = [...new Set(sales.flatMap((sale) => (sale.items || []).map((item) => item.category).filter(Boolean)))].sort();
            const chartData = this.getSalesChartData(sales);

            return res.render("admin/sales/salesDashboard.ejs", {
                stats,
                categories,
                filters: { startDate: '', endDate: '', status: '', category: '' },
                chartData
            });
        } catch (error) {
            console.error("Erro ao montar dashboard de vendas:", error);
            return res.status(500).send("Erro ao montar dashboard de vendas");
        }
    }

    async salesList(req, res) {
        try {
            const { startDate, endDate, status, category } = req.query;
            const sales = (await Sale.findAll({ order: [['createdAt', 'DESC']] })).map(sale => sale.get({ plain: true }));

            const filteredSales = sales.filter((sale) => {
                const saleDate = new Date(sale.createdAt);
                const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
                const to = endDate ? new Date(`${endDate}T23:59:59`) : null;

                const matchesDate = (!from || saleDate >= from) && (!to || saleDate <= to);
                const matchesStatus = !status || sale.status === status;
                const matchesCategory = !category || (Array.isArray(sale.items) && sale.items.some((item) =>
                    item.category && item.category.toLowerCase() === category.toLowerCase()
                ));

                return matchesDate && matchesStatus && matchesCategory;
            });

            const categories = [...new Set(sales.flatMap((sale) => (sale.items || []).map((item) => item.category).filter(Boolean)))].sort();

            return res.render("admin/sales/salesList.ejs", {
                sales: filteredSales,
                categories,
                filters: { startDate: startDate || '', endDate: endDate || '', status: status || '', category: category || '' }
            });
        } catch (error) {
            console.error("Erro ao montar listagem de vendas:", error);
            return res.status(500).send("Erro ao montar listagem de vendas");
        }
    }

    getSalesStats(sales) {
        const statusCounts = { pending: 0, confirmed: 0, cancelled: 0 };
        const totals = { total: 0, pending: 0, confirmed: 0, cancelled: 0 };

        sales.forEach((sale) => {
            const status = sale.status || 'pending';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            totals.total += Number(sale.total || 0);
            totals[status] += Number(sale.total || 0);
        });

        return {
            totalSales: sales.length,
            totalRevenue: totals.total,
            pendingCount: statusCounts.pending,
            confirmedCount: statusCounts.confirmed,
            cancelledCount: statusCounts.cancelled,
            pendingRevenue: totals.pending,
            confirmedRevenue: totals.confirmed,
            cancelledRevenue: totals.cancelled
        };
    }

    getSalesChartData(sales) {
        const statusCounts = { pending: 0, confirmed: 0, cancelled: 0 };
        const dailyMap = {};

        sales.forEach((sale) => {
            const status = sale.status || 'pending';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            const key = new Date(sale.createdAt).toISOString().split('T')[0];
            const label = new Date(sale.createdAt).toLocaleDateString('pt-BR');

            if (!dailyMap[key]) {
                dailyMap[key] = { label, total: 0, orders: 0 };
            }

            dailyMap[key].total += Number(sale.total || 0);
            dailyMap[key].orders += 1;
        });

        const dailyEntries = Object.values(dailyMap).sort((a, b) => a.label.localeCompare(b.label)).slice(-7);

        return {
            statusCounts,
            dailyLabels: dailyEntries.map((entry) => entry.label),
            dailyRevenue: dailyEntries.map((entry) => entry.total),
            dailyOrders: dailyEntries.map((entry) => entry.orders)
        };
    }

    async salePending(req, res) {
        try {
            const sales = await Sale.findAll({
                where: { status: 'pending' },
                order: [['createdAt', 'DESC']]
            });
            return res.render("admin/sales/salesPending.ejs", { sales });
        } catch (error) {
            console.error("Erro ao buscar vendas pendentes:", error);
            return res.status(500).send("Erro ao buscar vendas pendentes");
        }
    }

    async saleConfirmed(req, res) {
        try {
            const sales = await Sale.findAll({
                where: { status: 'confirmed' },
                order: [['createdAt', 'DESC']]
            });
            return res.render("admin/sales/salesConfirmed.ejs", { sales });
        } catch (error) {
            console.error("Erro ao buscar vendas confirmadas:", error);
            return res.status(500).send("Erro ao buscar vendas confirmadas");
        }
    }

    async saleCancelled(req, res) {
        try {
            const sales = await Sale.findAll({
                where: { status: 'cancelled' },
                order: [['createdAt', 'DESC']]
            });
            return res.render("admin/sales/salesCancelled.ejs", { sales });
        } catch (error) {
            console.error("Erro ao buscar vendas canceladas:", error);
            return res.status(500).send("Erro ao buscar vendas canceladas");
        }
    }

    async confirmSale(req, res) {
        try {
            const { id } = req.params;
            const sale = await Sale.findByPk(id);

            if (!sale) {
                return res.status(404).json({ error: "Venda não encontrada" });
            }

            sale.status = 'confirmed';
            await sale.save();

            return res.redirect("/admin/sales/list");
        } catch (error) {
            console.error("Erro ao confirmar venda:", error);
            return res.status(500).send("Erro ao confirmar venda");
        }
    }

    async cancelSale(req, res) {
        try {
            const { id } = req.params;
            const sale = await Sale.findByPk(id);

            if (!sale) {
                return res.status(404).json({ error: "Venda não encontrada" });
            }

            sale.status = 'cancelled';
            await sale.save();

            return res.redirect("/admin/sales/list");
        } catch (error) {
            console.error("Erro ao cancelar venda:", error);
            return res.status(500).send("Erro ao cancelar venda");
        }
    }
}

export default new SalesController();
