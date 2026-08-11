import plotly.graph_objects as go


def add_approach(fig, categories, name, values, highlight=True):
    if len(categories) != len(values):
        print(f"Error: Values has the wrong length. Has: {len(values)}, Needs: {len(categories)}")

    # Close the polygon
    categories_closed = categories + [categories[0]]
    values_closed = values + [values[0]]

    fig.add_trace(go.Scatterpolar(
        r=values_closed,
        theta=categories_closed,
        fill="toself",
        name=name,
        opacity=1.0 if highlight else 0.25,
        line=dict(width=3 if highlight else 1)
    ))


def plot_radar():
    categories = [
        "Security",
        "Features",
        "Dev Experience",
        "Performance",
        "Complexity",
        "Techstack independent",
        "Cross Platform"
    ]

    fig = go.Figure()

    add_approach(fig, categories, "In Process",
                 [10, 100, 100, 100, 100, 10, 100])

    add_approach(fig, categories, "Scripting Engine",
                 [20, 90, 20, 90, 80, 70, 100])

    add_approach(fig, categories, "Sidecar Process",
                 [100, 75, 80, 80, 30, 70, 10])

    add_approach(fig, categories, "Webhook",
                 [90, 50, 100, 20, 50, 90, 10])

    fig.update_layout(
        title="Plugin Architectures",
        showlegend=True,
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 100]
            )
        )
    )

    fig.show()


def main():
    plot_radar()


if __name__ == "__main__":
    main()
