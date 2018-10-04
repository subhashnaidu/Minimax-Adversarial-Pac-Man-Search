public class Node<Point>
{
    private Point data;
    Node<Point> parent;
    private List<Node<Point>> children = new ArrayList<>();

    public Node(Point data)
    {
        this.data = data;
        this.parent = null;
    }

    public Node<Point> addChild(Node child)
    {
        child.setParent(this);
        this.children.add(child);
        return child;
    }

    public void addChildren(List<Node<Point>> children)
    {
        children.forEach(each -> each.setParent(this));
        this.children.addAll(children);
    }

    public List<Node<Point>> getChildren() {
        return children;
    }

    public Point getData() {
        return data;
    }

    public void setData(Point data) {
        this.data = data;
    }

    private void setParent(Node<Point> parent) {
        this.parent = parent;
    }

    public Node<Point> getParent() {
        return parent;
    }
}